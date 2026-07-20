/**
 * Measure chunking — groups measures into pages of 27 measures each
 */

import type {
  Part,
  Measure,
  MeasureChunk,
  KeySignature,
  ClefType,
  DEFAULT_MEASURES_PER_PAGE,
} from "./types";
import { DEFAULT_MEASURES_PER_PAGE as MEASURES_PER_PAGE } from "./types";

export interface ChunkOptions {
  measuresPerPage?: number;
}

/**
 * Chunk measures into pages of the specified size
 *
 * Each chunk is a self-contained unit that can be rendered independently.
 * The last chunk may have fewer than measuresPerPage measures.
 */
export function chunkMeasures(
  parts: Part[],
  startMeasure: number = 1,
  options: ChunkOptions = {},
  ppq: number = 480
): MeasureChunk[] {
  const measuresPerPage = options.measuresPerPage ?? MEASURES_PER_PAGE;

  if (parts.length === 0) {
    return [];
  }

  // Find the total number of measures across all parts
  // All parts should have the same number of measures, but we verify
  const totalMeasures = Math.max(...parts.map((p) => p.measures.length));

  if (totalMeasures === 0) {
    return [];
  }

  const chunks: MeasureChunk[] = [];

  // Calculate number of chunks needed
  const numChunks = Math.ceil(totalMeasures / measuresPerPage);

  for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
    const startIdx = chunkIndex * measuresPerPage;
    const endIdx = Math.min(startIdx + measuresPerPage, totalMeasures);

    // Extract measures for this chunk from each part
    const chunkParts: Part[] = parts.map((part) => ({
      id: part.id,
      name: part.name,
      measures: part.measures.slice(startIdx, endIdx),
      clef: part.clef,
      keySignature: part.keySignature,
      isDrum: part.isDrum,
    }));

    // Get the attributes from the first measure of the first part
    // These will be used to create the <attributes> element in MusicXML
    const firstMeasure = parts[0].measures[startIdx];

    const chunk: MeasureChunk = {
      parts: chunkParts,
      startMeasure: startIdx + startMeasure,
      endMeasure: endIdx + startMeasure - 1,
      divisions: ppq, // Use actual MIDI ppq so durations match the XML declaration
      clef: parts[0].clef,
      keySignature: parts[0].keySignature,
      timeSignature: firstMeasure?.timeSignature ?? { beats: 4, beatType: 4 },
      initialTempoBpm: 120, // Default tempo
    };

    chunks.push(chunk);
  }

  return chunks;
}

/**
 * Get the number of pages (chunks) for a given number of measures
 */
export function getChunkCount(totalMeasures: number, measuresPerPage: number = MEASURES_PER_PAGE): number {
  if (totalMeasures <= 0) return 0;
  return Math.ceil(totalMeasures / measuresPerPage);
}

/**
 * Get the measure range for a specific page (1-indexed)
 */
export function getMeasureRangeForPage(
  pageNumber: number, // 1-indexed
  totalMeasures: number,
  measuresPerPage: number = MEASURES_PER_PAGE
): { startMeasure: number; endMeasure: number; isLastPage: boolean } {
  const startMeasure = (pageNumber - 1) * measuresPerPage + 1;
  const endMeasure = Math.min(pageNumber * measuresPerPage, totalMeasures);
  const isLastPage = endMeasure >= totalMeasures;

  return { startMeasure, endMeasure, isLastPage };
}

/**
 * Validate that chunk boundaries are correct
 */
export function validateChunks(chunks: MeasureChunk[]): boolean {
  if (chunks.length === 0) return true;

  let expectedStart = 1;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Check start measure is correct
    if (chunk.startMeasure !== expectedStart) {
      console.error(
        `Chunk ${i}: expected start ${expectedStart}, got ${chunk.startMeasure}`
      );
      return false;
    }

    // Check end measure is correct
    const expectedEnd = expectedStart + getChunkMeasureCount(chunk) - 1;
    if (chunk.endMeasure !== expectedEnd) {
      console.error(
        `Chunk ${i}: expected end ${expectedEnd}, got ${chunk.endMeasure}`
      );
      return false;
    }

    expectedStart = chunk.endMeasure + 1;
  }

  return true;
}

/**
 * Get the number of measures in a chunk
 */
export function getChunkMeasureCount(chunk: MeasureChunk): number {
  if (chunk.parts.length === 0) return 0;
  return chunk.parts[0].measures.length;
}

/**
 * Get a specific chunk by page number (1-indexed)
 */
export function getChunkAtPage(
  chunks: MeasureChunk[],
  pageNumber: number
): MeasureChunk | null {
  const index = pageNumber - 1;
  if (index < 0 || index >= chunks.length) {
    return null;
  }
  return chunks[index];
}

/**
 * Extract all unique time signatures used in the chunks
 */
export function getUniqueTimeSignatures(
  chunks: MeasureChunk[]
): { beats: number; beatType: number }[] {
  const signatures = new Set<string>();
  const result: { beats: number; beatType: number }[] = [];

  for (const chunk of chunks) {
    for (const part of chunk.parts) {
      for (const measure of part.measures) {
        const key = `${measure.timeSignature.beats}/${measure.timeSignature.beatType}`;
        if (!signatures.has(key)) {
          signatures.add(key);
          result.push(measure.timeSignature);
        }
      }
    }
  }

  return result;
}

/**
 * Check if any chunk contains a time signature change
 */
export function hasTimeSignatureChanges(chunks: MeasureChunk[]): boolean {
  return getUniqueTimeSignatures(chunks).length > 1;
}
