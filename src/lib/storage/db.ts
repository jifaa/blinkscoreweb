import { openDB, type IDBPDatabase } from "idb"

export interface ScoreMetadata {
  id: string
  name: string
  fileName: string
  totalPages: number
  currentPage: number
  lastRead: number
  addedAt: number
  thumbnail?: string
}

export interface StoredScore {
  id: string
  pdfData: ArrayBuffer
  metadata: ScoreMetadata
}

const DB_NAME = "blinkscore-library"
const DB_VERSION = 1
const SCORES_STORE = "scores"

let dbPromise: Promise<IDBPDatabase> | null = null

async function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SCORES_STORE)) {
          const store = db.createObjectStore(SCORES_STORE, { keyPath: "id" })
          store.createIndex("lastRead", "metadata.lastRead")
          store.createIndex("addedAt", "metadata.addedAt")
        }
      },
    })
  }
  return dbPromise
}

export async function saveScore(file: File, metadata: Partial<ScoreMetadata>): Promise<string> {
  const db = await getDb()
  const id = crypto.randomUUID()

  // Read file as ArrayBuffer
  const pdfData = await file.arrayBuffer()

  const scoreMetadata: ScoreMetadata = {
    id,
    name: metadata.name || file.name,
    fileName: file.name,
    totalPages: metadata.totalPages || 0,
    currentPage: metadata.currentPage || 1,
    lastRead: Date.now(),
    addedAt: Date.now(),
  }

  await db.put(SCORES_STORE, {
    id,
    pdfData,
    metadata: scoreMetadata,
  })

  return id
}

export async function getScore(id: string): Promise<{ metadata: ScoreMetadata; pdfUrl: string } | null> {
  const db = await getDb()
  const stored = await db.get(SCORES_STORE, id)

  if (!stored) return null

  // Create a blob URL for the PDF
  const blob = new Blob([stored.pdfData], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)

  // Update last read time
  await updateScoreProgress(id, stored.metadata.currentPage)

  return {
    metadata: stored.metadata,
    pdfUrl: url,
  }
}

export async function getAllScores(): Promise<ScoreMetadata[]> {
  const db = await getDb()
  const all = await db.getAll(SCORES_STORE)
  return all
    .map((s) => s.metadata)
    .sort((a, b) => b.lastRead - a.lastRead)
}

export async function deleteScore(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(SCORES_STORE, id)
}

export async function updateScoreProgress(id: string, currentPage: number): Promise<void> {
  const db = await getDb()
  const stored = await db.get(SCORES_STORE, id)

  if (stored) {
    stored.metadata.currentPage = currentPage
    stored.metadata.lastRead = Date.now()
    await db.put(SCORES_STORE, stored)
  }
}

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

export async function clearLibrary(): Promise<void> {
  const db = await getDb()
  await db.clear(SCORES_STORE)
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
