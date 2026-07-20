/**
 * Quantization logic — snaps note timings to a grid and groups into measures
 */

import type {
  ParsedMidi,
  MidiNote,
  QuantizedNote,
  Measure,
  Part,
  QuantGrid,
} from "./types";
import { getTimeSignatureAtTick } from "./parseMidi";

/**
 * Determine the quantization grid size in ticks
 */
function getGridSize(ppq: number, grid: QuantGrid, tempoBpm: number): number {
  const quarterNoteTicks = ppq;

  switch (grid) {
    case "1/8":
      return quarterNoteTicks / 2; // Eighth notes
    case "1/16":
      return quarterNoteTicks / 4; // Sixteenth notes
    case "1/32":
      return quarterNoteTicks / 8; // Thirty-second notes
    case "auto":
    default:
      // Auto: use sixteenth notes as a good default
      return quarterNoteTicks / 4;
  }
}

/**
 * Snap a tick position to the nearest grid position
 */
function snapToGrid(ticks: number, gridSize: number): number {
  return Math.round(ticks / gridSize) * gridSize;
}

/**
 * Calculate measure boundaries based on time signatures
 */
function calculateMeasureBoundaries(
  midi: ParsedMidi,
  ppq: number
): { start: number; end: number; timeSignature: { beats: number; beatType: number } }[] {
  const boundaries: {
    start: number;
    end: number;
    timeSignature: { beats: number; beatType: number };
  }[] = [];

  // Calculate MIDI duration from notes
  let midiDuration = 0;
  for (const track of midi.tracks) {
    for (const note of track.notes) {
      const endTicks = note.midiTime + note.duration;
      if (endTicks > midiDuration) {
        midiDuration = endTicks;
      }
    }
  }
  // Minimum duration of one measure
  if (midiDuration === 0) {
    midiDuration = ppq * 4; // One 4/4 measure
  }

  // Get all time signature change points
  const changePoints = new Map<number, { beats: number; beatType: number }>();
  for (const ts of midi.timeSignatureEvents) {
    changePoints.set(ts.ticks, { beats: ts.beats, beatType: ts.beatType });
  }

  // Sort change points by tick position
  const sortedChanges = Array.from(changePoints.entries()).sort(
    (a, b) => a[0] - b[0]
  );

  // Calculate measure lengths
  // Measure length in ticks = beats * (ppq * 4 / beatType)
  // e.g., for 4/4: 4 * (ppq * 4 / 4) = 4 * ppq = 4 quarter notes per measure
  // e.g., for 3/4: 3 * (ppq * 4 / 4) = 3 * ppq = 3 quarter notes per measure
  // e.g., for 6/8: 6 * (ppq * 4 / 8) = 6 * ppq/2 = 3 quarter notes per measure

  function getMeasureLength(beats: number, beatType: number): number {
    return beats * ppq * (4 / beatType);
  }

  // Determine starting time signature
  let currentTimeSig = { beats: 4, beatType: 4 };
  let measureLength = getMeasureLength(currentTimeSig.beats, currentTimeSig.beatType);

  // Check if there's a time signature at tick 0
  const tick0Ts = changePoints.get(0);
  if (tick0Ts) {
    currentTimeSig = tick0Ts;
    measureLength = getMeasureLength(currentTimeSig.beats, currentTimeSig.beatType);
  }

  // Process from tick 0
  let measureStart = 0;
  let currentTick = 0;

  // Skip to first time signature change if it's not at 0
  if (sortedChanges.length > 0 && sortedChanges[0][0] > 0) {
    measureStart = sortedChanges[0][0];
    currentTick = sortedChanges[0][0];
    currentTimeSig = sortedChanges[0][1];
    measureLength = getMeasureLength(currentTimeSig.beats, currentTimeSig.beatType);
  }

  // Add measures until we exceed the MIDI duration
  while (measureStart < midiDuration) {
    const measureEnd = measureStart + measureLength;
    boundaries.push({
      start: measureStart,
      end: measureEnd,
      timeSignature: currentTimeSig,
    });

    measureStart = measureEnd;

    // Check for time signature change at this boundary
    const nextChange = sortedChanges.find(
      ([ticks]) => ticks === measureStart
    );
    if (nextChange) {
      currentTimeSig = nextChange[1];
      measureLength = getMeasureLength(currentTimeSig.beats, currentTimeSig.beatType);
    }
  }

  // If no boundaries were created, create at least one measure
  if (boundaries.length === 0) {
    const defaultTs = changePoints.get(0) || { beats: 4, beatType: 4 };
    boundaries.push({
      start: 0,
      end: getMeasureLength(defaultTs.beats, defaultTs.beatType),
      timeSignature: defaultTs,
    });
  }

  return boundaries;
}

/**
 * Assign notes to measures
 */
function assignNotesToMeasures(
  notes: MidiNote[],
  measureBoundaries: {
    start: number;
    end: number;
    timeSignature: { beats: number; beatType: number };
  }[],
  ppq: number,
  gridSize: number
): QuantizedNote[] {
  const quantizedNotes: QuantizedNote[] = [];

  for (const note of notes) {
    // Find which measure this note belongs to
    let measureIndex = 0;
    for (let i = 0; i < measureBoundaries.length; i++) {
      if (note.midiTime < measureBoundaries[i].end) {
        measureIndex = i;
        break;
      }
      measureIndex = i;
    }

    const measure = measureBoundaries[measureIndex];
    const measureStart = measure.start;

    // Quantize the start and duration
    const quantizedStart = snapToGrid(note.midiTime, gridSize);
    const quantizedEnd = snapToGrid(note.midiTime + note.duration, gridSize);
    const quantizedDuration = Math.max(gridSize, quantizedEnd - quantizedStart);

    // Calculate beat position within measure (0-based, fractional)
    const ticksIntoMeasure = quantizedStart - measureStart;
    const quarterNoteTicks = ppq;
    const beatDuration = quarterNoteTicks * (4 / measure.timeSignature.beatType);
    const beat = ticksIntoMeasure / beatDuration;

    quantizedNotes.push({
      ...note,
      quantizedStart,
      quantizedDuration,
      measure: measureIndex,
      beat,
    });
  }

  return quantizedNotes;
}

/**
 * Group notes by part (track/channel)
 */
function groupNotesByPart(
  tracks: ParsedMidi["tracks"]
): Map<string, { trackId: number; channel: number; isDrum: boolean; notes: MidiNote[] }> {
  const parts = new Map<
    string,
    { trackId: number; channel: number; isDrum: boolean; notes: MidiNote[] }
  >();

  for (const track of tracks) {
    // Group by track for now (could also group by channel for multi-channel tracks)
    const key = `track-${track.id}`;
    parts.set(key, {
      trackId: track.id,
      channel: track.channel,
      isDrum: track.isDrum,
      notes: [...track.notes],
    });
  }

  return parts;
}

/**
 * Quantize a MIDI file to a grid and group into measures
 */
export function quantizeNotes(
  midi: ParsedMidi,
  grid: QuantGrid = "auto"
): {
  parts: Part[];
  measureBoundaries: {
    start: number;
    end: number;
    timeSignature: { beats: number; beatType: number };
  }[];
} {
  const ppq = midi.ppq;
  const gridSize = getGridSize(ppq, grid, midi.initialTempoBpm);

  // Calculate measure boundaries
  const measureBoundaries = calculateMeasureBoundaries(midi, ppq);

  // Group notes by part (track)
  const partGroups = groupNotesByPart(midi.tracks);

  // Quantize notes for each part and create measure objects
  const parts: Part[] = [];

  // Check if we have any notes
  const anyNotes = hasAnyNotes(midi.tracks);

  if (!anyNotes) {
    // Create at least one part with empty measures showing the time signature
    parts.push({
      id: "P1",
      name: "Part 1",
      measures: createEmptyMeasures(measureBoundaries),
      clef: "G",
      keySignature: { fifths: 0, mode: "major" },
      isDrum: false,
    });
  } else {
    let partIndex = 0;
    for (const [key, partData] of partGroups) {
      if (partData.notes.length === 0) {
        // For empty tracks, create empty measures
        parts.push({
          id: `P${partIndex + 1}`,
          name: partData.trackId === 0 ? "Part 1" : `Part ${partIndex + 1}`,
          measures: createEmptyMeasures(measureBoundaries),
          clef: "G",
          keySignature: { fifths: 0, mode: "major" },
          isDrum: partData.isDrum,
        });
        partIndex++;
        continue;
      }

      const quantizedNotes = assignNotesToMeasures(
        partData.notes,
        measureBoundaries,
        ppq,
        gridSize
      );

      // Group quantized notes by measure
      const measures: Measure[] = measureBoundaries.map((boundary, index) => {
        const notesInMeasure = quantizedNotes.filter((n) => n.measure === index);
        return {
          number: index + 1, // 1-indexed for MusicXML
          startTicks: boundary.start,
          endTicks: boundary.end,
          notes: notesInMeasure,
          timeSignature: boundary.timeSignature,
        };
      });

      // Determine clef based on pitch range
      const { clef } = determineClefForNotes(partData.notes);

      // Detect key signature (could be passed in or detected)
      const keySignature = { fifths: 0, mode: "major" as const };

      parts.push({
        id: `P${partIndex + 1}`,
        name: `Part ${partIndex + 1}`,
        measures,
        clef,
        keySignature,
        isDrum: partData.isDrum,
      });

      partIndex++;
    }
  }

  return { parts, measureBoundaries };
}

/**
 * Check if any track has notes
 */
function hasAnyNotes(tracks: ParsedMidi["tracks"]): boolean {
  return tracks.some((track) => track.notes.length > 0);
}

/**
 * Create empty measures for parts with no notes
 */
function createEmptyMeasures(
  measureBoundaries: { start: number; end: number; timeSignature: { beats: number; beatType: number } }[]
): Measure[] {
  return measureBoundaries.map((boundary, index) => ({
    number: index + 1,
    startTicks: boundary.start,
    endTicks: boundary.end,
    notes: [],
    timeSignature: boundary.timeSignature,
  }));
}

/**
 * Determine clef based on note pitch range
 */
function determineClefForNotes(
  notes: MidiNote[]
): { clef: "G" | "F" | "C" } {
  if (notes.length === 0) {
    return { clef: "G" };
  }

  const pitches = notes.map((n) => n.pitch);
  const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;

  // G clef: for treble/middle range (average pitch ~60 = middle C)
  // F clef: for bass range (average pitch < 50)
  if (avgPitch < 48) {
    return { clef: "F" };
  }

  return { clef: "G" };
}

/**
 * Merge parts that have the same clef and are in the same pitch range
 * This is useful for reducing the number of staves
 */
export function mergeCompatibleParts(parts: Part[]): Part[] {
  // For now, just return parts as-is
  // Future enhancement: merge parts that can share a staff
  return parts;
}
