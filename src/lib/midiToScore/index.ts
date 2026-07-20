/**
 * MIDI-to-Score pipeline barrel export
 */

export * from "./types";
export { parseMidi, getTempoAtTick, getTimeSignatureAtTick, getMidiDuration, flattenNotes } from "./parseMidi";
export { detectKey, getKeyName, determineClef, getClefForKey } from "./keyDetection";
export { quantizeNotes, mergeCompatibleParts } from "./quantize";
export {
  chunkMeasures,
  getChunkCount,
  getMeasureRangeForPage,
  validateChunks,
  getChunkMeasureCount,
  getChunkAtPage,
  getUniqueTimeSignatures,
  hasTimeSignatureChanges,
} from "./chunkMeasures";
export { buildMusicXml, buildSimpleTestXml } from "./buildMusicXml";
