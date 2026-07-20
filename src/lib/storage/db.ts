import { openDB, type IDBPDatabase } from "idb"
import type { KeySignature } from "~/lib/midiToScore/types"

export interface ScoreMetadata {
  id: string
  name: string
  fileName: string
  totalPages: number
  currentPage: number
  lastRead: number
  addedAt: number
  thumbnail?: string
  // MIDI-specific fields
  contentType: "pdf" | "midi"
  midiKeySignature?: KeySignature
  midiQuantGrid?: string
}

export interface StoredScore {
  id: string
  data: ArrayBuffer  // PDF data or MIDI data
  metadata: ScoreMetadata
}

// MIDI chunks cache - stores generated MusicXML per page
export interface MidiChunkCache {
  scoreId: string
  chunkIndex: number
  musicXml: string
  cachedAt: number
}

const DB_NAME = "blinkscore-library"
const DB_VERSION = 4  // Bumped to invalidate old MusicXML cache (pre-fix gap filling)
const SCORES_STORE = "scores"
const MIDI_CHUNKS_STORE = "midi-chunks"

let dbPromise: Promise<IDBPDatabase> | null = null

async function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Create scores store if it doesn't exist
        if (!db.objectStoreNames.contains(SCORES_STORE)) {
          const store = db.createObjectStore(SCORES_STORE, { keyPath: "id" })
          store.createIndex("lastRead", "metadata.lastRead")
          store.createIndex("addedAt", "metadata.addedAt")
        }

        // Always recreate the MIDI chunks store on any upgrade so stale
        // (pre-fix) MusicXML is automatically cleared.
        if (db.objectStoreNames.contains(MIDI_CHUNKS_STORE)) {
          db.deleteObjectStore(MIDI_CHUNKS_STORE)
        }
        const chunkStore = db.createObjectStore(MIDI_CHUNKS_STORE, { keyPath: ["scoreId", "chunkIndex"] })
        chunkStore.createIndex("scoreId", "scoreId")
      },
    })

    // Run migration after DB is opened (upgrade callback is synchronous)
    const db = await dbPromise
    const tx = db.transaction(SCORES_STORE, "readwrite")
    const store = tx.objectStore(SCORES_STORE)
    const allRecords = await store.getAll()

    for (const record of allRecords) {
      if (!record.metadata.contentType) {
        record.metadata.contentType = "pdf"
        await store.put(record)
      }
    }
  }
  return dbPromise
}

/**
 * Save a PDF file to the library
 */
export async function saveScore(file: File, metadata: Partial<ScoreMetadata>): Promise<string> {
  const db = await getDb()
  const id = crypto.randomUUID()

  // Read file as ArrayBuffer
  const data = await file.arrayBuffer()

  const scoreMetadata: ScoreMetadata = {
    id,
    name: metadata.name || file.name,
    fileName: file.name,
    totalPages: metadata.totalPages || 0,
    currentPage: metadata.currentPage || 1,
    lastRead: Date.now(),
    addedAt: Date.now(),
    contentType: "pdf",
  }

  await db.put(SCORES_STORE, {
    id,
    data,
    metadata: scoreMetadata,
  })

  return id
}

/**
 * Save a MIDI file to the library
 */
export async function saveMidiToLibrary(
  file: File,
  metadata: {
    name: string
    totalPages: number
    keySignature?: KeySignature
    quantGrid?: string
    thumbnail?: string
  }
): Promise<string> {
  const db = await getDb()
  const id = crypto.randomUUID()

  // Read file as ArrayBuffer
  const data = await file.arrayBuffer()

  const scoreMetadata: ScoreMetadata = {
    id,
    name: metadata.name,
    fileName: file.name,
    totalPages: metadata.totalPages,
    currentPage: 1,
    lastRead: Date.now(),
    addedAt: Date.now(),
    contentType: "midi",
    midiKeySignature: metadata.keySignature,
    midiQuantGrid: metadata.quantGrid,
    thumbnail: metadata.thumbnail,
  }

  await db.put(SCORES_STORE, {
    id,
    data,
    metadata: scoreMetadata,
  })

  return id
}

/**
 * Get a PDF score by ID
 */
export async function getScore(id: string): Promise<{ metadata: ScoreMetadata; pdfUrl: string } | null> {
  const db = await getDb()
  const stored = await db.get(SCORES_STORE, id)

  if (!stored) return null

  // Only return PDF scores
  if (stored.metadata.contentType !== "pdf") {
    return null
  }

  // Create a blob URL for the PDF
  const blob = new Blob([stored.data], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)

  // Update last read time
  await updateScoreProgress(id, stored.metadata.currentPage)

  return {
    metadata: stored.metadata,
    pdfUrl: url,
  }
}

/**
 * Get a MIDI score by ID
 */
export async function getMidiScore(id: string): Promise<{
  metadata: ScoreMetadata
  midiUrl: string
} | null> {
  const db = await getDb()
  const stored = await db.get(SCORES_STORE, id)

  if (!stored) return null

  // Only return MIDI scores
  if (stored.metadata.contentType !== "midi") {
    return null
  }

  // Create a blob URL for the MIDI file
  const blob = new Blob([stored.data], { type: "audio/midi" })
  const url = URL.createObjectURL(blob)

  // Update last read time
  await updateScoreProgress(id, stored.metadata.currentPage)

  return {
    metadata: stored.metadata,
    midiUrl: url,
  }
}

/**
 * Get cached MIDI chunks for a score (cache-first loading)
 */
export async function getCachedMidiChunks(scoreId: string): Promise<string[] | null> {
  const db = await getDb()
  const chunks = await db.getAllFromIndex(MIDI_CHUNKS_STORE, "scoreId", scoreId)

  if (chunks.length === 0) return null

  // Return chunks in order
  return chunks
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map((c) => c.musicXml)
}

/**
 * Cache generated MIDI chunks
 */
export async function cacheMidiChunks(scoreId: string, chunks: string[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(MIDI_CHUNKS_STORE, "readwrite")

  // Store each chunk
  for (let i = 0; i < chunks.length; i++) {
    await tx.store.put({
      scoreId,
      chunkIndex: i,
      musicXml: chunks[i],
      cachedAt: Date.now(),
    })
  }

  await tx.done
}

/**
 * Clear cached MIDI chunks for a score
 */
export async function clearMidiChunkCache(scoreId: string): Promise<void> {
  const db = await getDb()
  const chunks = await db.getAllFromIndex(MIDI_CHUNKS_STORE, "scoreId", scoreId)

  const tx = db.transaction(MIDI_CHUNKS_STORE, "readwrite")
  for (const chunk of chunks) {
    await tx.store.delete([chunk.scoreId, chunk.chunkIndex])
  }
  await tx.done
}

export async function getAllScores(): Promise<ScoreMetadata[]> {
  const db = await getDb()
  const all = await db.getAll(SCORES_STORE)
  return all
    .map((s) => s.metadata)
    .sort((a, b) => b.lastRead - a.lastRead)
}

/**
 * Delete a score and its associated MIDI chunks cache
 */
export async function deleteScore(id: string): Promise<void> {
  const db = await getDb()

  // Delete the score
  await db.delete(SCORES_STORE, id)

  // Also delete any cached MIDI chunks
  await clearMidiChunkCache(id)
}

/**
 * Delete a MIDI score specifically
 */
export async function deleteMidiScore(id: string): Promise<void> {
  const db = await getDb()
  const stored = await db.get(SCORES_STORE, id)

  if (stored && stored.metadata.contentType === "midi") {
    await db.delete(SCORES_STORE, id)
    await clearMidiChunkCache(id)
  }
}

/**
 * Update the current page progress for a score
 */
export async function updateScoreProgress(id: string, currentPage: number): Promise<void> {
  const db = await getDb()
  const stored = await db.get(SCORES_STORE, id)

  if (stored) {
    stored.metadata.currentPage = currentPage
    stored.metadata.lastRead = Date.now()
    await db.put(SCORES_STORE, stored)
  }
}

/**
 * Update score metadata
 */
export async function updateScoreMetadata(
  id: string,
  updates: Partial<Omit<ScoreMetadata, "id">>
): Promise<void> {
  const db = await getDb()
  const stored = await db.get(SCORES_STORE, id)

  if (stored) {
    stored.metadata = { ...stored.metadata, ...updates }
    await db.put(SCORES_STORE, stored)
  }
}

/**
 * Clear all scores from the library
 */
export async function clearLibrary(): Promise<void> {
  const db = await getDb()
  await db.clear(SCORES_STORE)
  await db.clear(MIDI_CHUNKS_STORE)
}

// Generate thumbnail from PDF page
export async function generateThumbnail(
  pdfUrl: string,
  pageNumber: number = 1
): Promise<string | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const loadingTask = pdfjsLib.getDocument(pdfUrl)
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(pageNumber)

    const viewport = page.getViewport({ scale: 0.2 })
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height

    const context = canvas.getContext("2d")
    if (!context) return null

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise

    return canvas.toDataURL()
  } catch (err) {
    console.error("Error generating thumbnail:", err)
    return null
  }
}
