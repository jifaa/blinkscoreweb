/**
 * MusicXML builder — generates a valid, self-contained MusicXML document per chunk
 *
 * Each chunk must re-declare clef/key/time signature at its first measure,
 * as OSMD only reads attributes from the document opening.
 */

import type {
  MeasureChunk,
  Part,
  Measure,
  QuantizedNote,
  KeySignature,
  ClefType,
} from "./types";
import { midiToScientificPitch } from "./types";

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Get MusicXML duration type for a given duration in ticks
 *
 * We map tick durations to standard MusicXML type elements:
 * - whole = 4 quarters
 * - half = 2 quarters
 * - quarter = 1 quarter
 * - eighth = 1/2 quarter
 * - 16th = 1/4 quarter
 * - 32nd = 1/8 quarter
 */
function getDurationType(
  durationTicks: number,
  divisions: number
): { type: string; dots: number } {
  const quarterTicks = divisions;
  const quarterDuration = durationTicks / quarterTicks;

  // Handle dotted notes
  if (quarterDuration >= 3) {
    // dotted half or longer
    const undotted = quarterDuration / 1.5;
    if (undotted >= 1.75 && undotted <= 2.05) {
      return { type: "half", dots: 1 };
    }
    if (undotted >= 0.9 && undotted <= 1.1) {
      return { type: "quarter", dots: 1 };
    }
  }

  // Whole note (4 quarters)
  if (quarterDuration >= 3.5 && quarterDuration <= 4.5) {
    return { type: "whole", dots: 0 };
  }
  if (quarterDuration >= 5.25 && quarterDuration <= 6.75) {
    return { type: "whole", dots: 1 };
  }

  // Half note (2 quarters)
  if (quarterDuration >= 1.75 && quarterDuration <= 2.25) {
    return { type: "half", dots: 0 };
  }
  if (quarterDuration >= 2.25 && quarterDuration <= 3) {
    return { type: "half", dots: 1 };
  }

  // Quarter note (1 quarter)
  if (quarterDuration >= 0.75 && quarterDuration <= 1.25) {
    return { type: "quarter", dots: 0 };
  }
  if (quarterDuration >= 1.25 && quarterDuration <= 1.75) {
    return { type: "quarter", dots: 1 };
  }

  // Eighth note (1/2 quarter)
  if (quarterDuration >= 0.375 && quarterDuration <= 0.625) {
    return { type: "eighth", dots: 0 };
  }
  if (quarterDuration >= 0.625 && quarterDuration <= 0.875) {
    return { type: "eighth", dots: 1 };
  }

  // 16th note (1/4 quarter)
  if (quarterDuration >= 0.1875 && quarterDuration <= 0.3125) {
    return { type: "16th", dots: 0 };
  }
  if (quarterDuration >= 0.3125 && quarterDuration <= 0.4375) {
    return { type: "16th", dots: 1 };
  }

  // 32nd note (1/8 quarter)
  if (quarterDuration >= 0.09375 && quarterDuration <= 0.15625) {
    return { type: "32nd", dots: 0 };
  }
  if (quarterDuration >= 0.15625 && quarterDuration <= 0.21875) {
    return { type: "32nd", dots: 1 };
  }

  // Default to quarter
  return { type: "quarter", dots: 0 };
}

/**
 * Convert MIDI pitch to MusicXML pitch notation
 */
function midiPitchToXml(pitch: number): { step: string; octave: number; alter: number } {
  const safePitch = typeof pitch === "number" && !isNaN(pitch) ? Math.max(0, Math.min(127, Math.round(pitch))) : 60;
  const pitchClasses = [
    { step: "C", alter: 0 },
    { step: "C", alter: 1 },
    { step: "D", alter: 0 },
    { step: "D", alter: 1 },
    { step: "E", alter: 0 },
    { step: "F", alter: 0 },
    { step: "F", alter: 1 },
    { step: "G", alter: 0 },
    { step: "G", alter: 1 },
    { step: "A", alter: 0 },
    { step: "A", alter: 1 },
    { step: "B", alter: 0 },
  ];
  const pitchClass = safePitch % 12;
  const octave = Math.floor(safePitch / 12) - 1;
  const { step, alter } = pitchClasses[pitchClass];
  return { step, octave, alter };
}

/**
 * Generate rest notes to fill a tick duration in a measure
 */
function generateRestNotes(durationTicks: number, divisions: number): string {
  let remaining = Math.round(durationTicks);
  if (remaining <= 0) return "";

  let result = "";

  // Standard duration options in quarter-note units
  const types: { ratio: number; type: string; dots: number }[] = [
    { ratio: 4, type: "whole", dots: 0 },
    { ratio: 3, type: "half", dots: 1 },
    { ratio: 2, type: "half", dots: 0 },
    { ratio: 1.5, type: "quarter", dots: 1 },
    { ratio: 1, type: "quarter", dots: 0 },
    { ratio: 0.75, type: "eighth", dots: 1 },
    { ratio: 0.5, type: "eighth", dots: 0 },
    { ratio: 0.375, type: "16th", dots: 1 },
    { ratio: 0.25, type: "16th", dots: 0 },
    { ratio: 0.1875, type: "32nd", dots: 1 },
    { ratio: 0.125, type: "32nd", dots: 0 },
  ];

  while (remaining > 0) {
    let matched = false;

    for (const t of types) {
      const ticks = Math.round(t.ratio * divisions);
      if (ticks <= remaining && ticks > 0) {
        let noteXml = "<note>";
        noteXml += "<rest/>";
        noteXml += `<duration>${ticks}</duration>`;
        noteXml += `<voice>1</voice>`;
        noteXml += `<type>${t.type}</type>`;
        for (let i = 0; i < t.dots; i++) {
          noteXml += "<dot/>";
        }
        noteXml += "</note>";
        result += noteXml;
        remaining -= ticks;
        matched = true;
        break;
      }
    }

    if (!matched) {
      if (remaining > 0) {
        let noteXml = "<note>";
        noteXml += "<rest/>";
        noteXml += `<duration>${remaining}</duration>`;
        noteXml += `<voice>1</voice>`;
        noteXml += `<type>32nd</type>`;
        noteXml += "</note>";
        result += noteXml;
        remaining = 0;
      }
      break;
    }
  }

  return result;
}

/**
 * Generate the <attributes> element for a measure
 */
function generateAttributes(
  divisions: number,
  keySignature: KeySignature,
  timeSignature: { beats: number; beatType: number },
  clef: ClefType,
  includeAll: boolean = true
): string {
  const parts: string[] = [];

  if (includeAll) {
    parts.push(`<divisions>${divisions}</divisions>`);
  }

  // Key signature
  parts.push(
    `<key><fifths>${keySignature.fifths}</fifths><mode>${keySignature.mode}</mode></key>`
  );

  // Time signature
  parts.push(
    `<time><beats>${timeSignature.beats}</beats><beat-type>${timeSignature.beatType}</beat-type></time>`
  );

  // Clef
  if (clef === "G") {
    parts.push(`<clef><sign>G</sign><line>2</line></clef>`);
  } else if (clef === "F") {
    parts.push(`<clef><sign>F</sign><line>4</line></clef>`);
  } else if (clef === "C") {
    parts.push(`<clef><sign>C</sign><line>2</line></clef>`);
  } else {
    parts.push(`<clef><sign>G</sign><line>2</line></clef>`);
  }

  return `<attributes>${parts.join("")}</attributes>`;
}

/**
 * Generate a single <note> element
 */
function generateNote(
  note: QuantizedNote,
  divisions: number,
  isRest: boolean = false,
  isChord: boolean = false
): string {
  const pitchInfo = midiPitchToXml(note.pitch);
  const durationInfo = getDurationType(note.quantizedDuration, divisions);
  const duration = Math.max(1, Math.round(note.quantizedDuration));

  let noteXml = "<note>";

  // <chord/> MUST come before <pitch> per MusicXML schema ordering
  if (isChord) {
    noteXml += "<chord/>";
  }

  if (isRest) {
    noteXml += "<rest/>";
  } else {
    let pitchXml = `<pitch><step>${pitchInfo.step}</step>`;
    if (pitchInfo.alter !== 0) {
      pitchXml += `<alter>${pitchInfo.alter}</alter>`;
    }
    pitchXml += `<octave>${pitchInfo.octave}</octave></pitch>`;
    noteXml += pitchXml;
  }

  // Duration is required on ALL notes (including chord notes) per MusicXML schema
  noteXml += `<duration>${duration}</duration>`;

  noteXml += `<voice>1</voice>`;

  // Type (note value) - ALWAYS required for every note in MusicXML
  let typeXml = `<type>${durationInfo.type}</type>`;
  for (let i = 0; i < durationInfo.dots; i++) {
    typeXml += `<dot/>`;
  }
  noteXml += typeXml;

  // Stem (for non-rests)
  if (!isRest) {
    noteXml += `<stem>${pitchInfo.octave >= 4 ? "down" : "up"}</stem>`;
  }

  // Notehead (for drums)
  if (note.channel === 9) {
    noteXml += `<notehead>normal</notehead>`;
  }

  noteXml += "</note>";
  return noteXml;
}

/**
 * Generate a <measure> element
 */
function generateMeasure(
  measure: Measure,
  divisions: number,
  measureNumber: number,
  isFirstInChunk: boolean,
  currentAttributes: { clef: ClefType; key: KeySignature; time: { beats: number; beatType: number } }
): { xml: string; attributes: typeof currentAttributes } {
  const newAttributes = {
    clef: currentAttributes.clef,
    key: currentAttributes.key,
    time: measure.timeSignature,
  };

  let measureXml = `<measure number="${measureNumber}">`;

  // Check if time signature changed
  const timeChanged =
    newAttributes.time.beats !== currentAttributes.time.beats ||
    newAttributes.time.beatType !== currentAttributes.time.beatType;

  // Add attributes at the start of the first measure of each chunk or if time signature changed
  if (isFirstInChunk || timeChanged) {
    measureXml += generateAttributes(
      divisions,
      newAttributes.key,
      newAttributes.time,
      newAttributes.clef,
      isFirstInChunk
    );
  }

  const measureStartTicks = Math.round(measure.startTicks);
  const measureEndTicks = Math.round(measure.endTicks);
  const { beats, beatType } = measure.timeSignature;
  const fullMeasureTicks = Math.round(beats * divisions * (4 / beatType));
  const expectedEndTicks = measureEndTicks > measureStartTicks
    ? measureEndTicks
    : measureStartTicks + fullMeasureTicks;
  const targetEndTicks = Math.round(expectedEndTicks);

  if (measure.notes.length === 0) {
    // Fill empty measure with rest notes
    measureXml += generateRestNotes(targetEndTicks - measureStartTicks, divisions);
  } else {
    // Sort notes by quantizedStart, then by pitch
    const sortedNotes = [...measure.notes].sort((a, b) => {
      const aStart = Math.round(a.quantizedStart ?? measureStartTicks);
      const bStart = Math.round(b.quantizedStart ?? measureStartTicks);
      if (aStart !== bStart) return aStart - bStart;
      return a.pitch - b.pitch;
    });

    // Group notes by quantizedStart for chord detection
    const eventGroups = new Map<number, QuantizedNote[]>();
    for (const note of sortedNotes) {
      const start = Math.round(note.quantizedStart ?? (measureStartTicks + note.beat * divisions * (4 / beatType)));
      if (!eventGroups.has(start)) {
        eventGroups.set(start, []);
      }
      eventGroups.get(start)!.push(note);
    }

    let currentTick = measureStartTicks;

    for (const [eventStartTicksRaw, chordNotes] of eventGroups.entries()) {
      const eventStartTicks = Math.round(eventStartTicksRaw);

      if (eventStartTicks >= targetEndTicks) {
        break;
      }

      // 1. Fill gap before this chord with rest notes if eventStartTicks > currentTick
      if (eventStartTicks > currentTick) {
        const gap = eventStartTicks - currentTick;
        measureXml += generateRestNotes(gap, divisions);
        currentTick = eventStartTicks;
      }

      // 2. Output chord notes (clamp duration so note does not extend past measure boundary)
      let maxDuration = 0;
      const maxAllowedDuration = targetEndTicks - eventStartTicks;

      for (let i = 0; i < chordNotes.length; i++) {
        const note = chordNotes[i];
        const isChord = i > 0;
        const clampedDur = Math.max(1, Math.min(Math.round(note.quantizedDuration), maxAllowedDuration));
        const clampedNote = { ...note, quantizedDuration: clampedDur };

        measureXml += generateNote(clampedNote, divisions, false, isChord);
        if (clampedDur > maxDuration) {
          maxDuration = clampedDur;
        }
      }

      currentTick = Math.max(currentTick, eventStartTicks + maxDuration);
    }

    // 3. Fill trailing gap up to targetEndTicks
    if (currentTick < targetEndTicks) {
      const trailingGap = targetEndTicks - currentTick;
      measureXml += generateRestNotes(trailingGap, divisions);
    }
  }

  measureXml += "</measure>";

  return { xml: measureXml, attributes: newAttributes };
}

/**
 * Generate a <part> element for a single part
 */
function generatePart(
  part: Part,
  divisions: number,
  startMeasureNumber: number
): string {
  let partXml = `<part id="${part.id}">`;

  let currentAttributes = {
    clef: part.clef,
    key: part.keySignature,
    time: part.measures[0]?.timeSignature ?? { beats: 4, beatType: 4 },
  };

  for (let i = 0; i < part.measures.length; i++) {
    const measure = part.measures[i];
    const measureNumber = startMeasureNumber + i;
    const isFirstInChunk = i === 0;

    const { xml, attributes } = generateMeasure(
      measure,
      divisions,
      measureNumber,
      isFirstInChunk,
      currentAttributes
    );

    partXml += xml;
    currentAttributes = attributes;
  }

  partXml += "</part>";
  return partXml;
}

/**
 * Generate a complete MusicXML document for a chunk
 *
 * This produces a self-contained MusicXML document that can be rendered
 * independently by OSMD without requiring any context from other chunks.
 */
export function buildMusicXml(chunk: MeasureChunk): string {
  const { parts, divisions, title } = chunk;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work>
    <work-title>${escapeXml(title || "Untitled")}</work-title>
  </work>
  <identification>
    <creator type="composer">BlinkScore MIDI Import</creator>
    <encoding>
      <software>BlinkScore</software>
      <encoding-date>${new Date().toISOString().split("T")[0]}</encoding-date>
    </encoding>
  </identification>
  <defaults>
    <scaling>
      <millimeters>7.0556</millimeters>
      <tenths>40</tenths>
    </scaling>
  </defaults>
  <part-list>
`;

  // Generate part-list entries
  for (const part of parts) {
    xml += `    <score-part id="${part.id}">
      <part-name>${escapeXml(part.name)}</part-name>
    </score-part>
`;
  }

  xml += `  </part-list>
`;

  // Generate parts; measure numbers always reset to 1 within each chunk document
  for (const part of parts) {
    xml += generatePart(part, divisions, 1);
  }

  xml += `\n</score-partwise>`;

  return xml;
}

/**
 * Generate a simple test MusicXML document
 */
export function buildSimpleTestXml(): string {
  const chunk: MeasureChunk = {
    parts: [
      {
        id: "P1",
        name: "Piano",
        clef: "G",
        keySignature: { fifths: 0, mode: "major" },
        isDrum: false,
        measures: [
          {
            number: 1,
            startTicks: 0,
            endTicks: 1920,
            timeSignature: { beats: 4, beatType: 4 },
            notes: [
              {
                pitch: 60, // Middle C
                midiTime: 0,
                duration: 480,
                velocity: 80,
                channel: 0,
                track: 0,
                quantizedStart: 0,
                quantizedDuration: 480,
                measure: 0,
                beat: 0,
              },
              {
                pitch: 62, // D
                midiTime: 480,
                duration: 480,
                velocity: 80,
                channel: 0,
                track: 0,
                quantizedStart: 480,
                quantizedDuration: 480,
                measure: 0,
                beat: 1,
              },
              {
                pitch: 64, // E
                midiTime: 960,
                duration: 480,
                velocity: 80,
                channel: 0,
                track: 0,
                quantizedStart: 960,
                quantizedDuration: 480,
                measure: 0,
                beat: 2,
              },
              {
                pitch: 65, // F
                midiTime: 1440,
                duration: 480,
                velocity: 80,
                channel: 0,
                track: 0,
                quantizedStart: 1440,
                quantizedDuration: 480,
                measure: 0,
                beat: 3,
              },
            ],
          },
        ],
      },
    ],
    startMeasure: 1,
    endMeasure: 1,
    divisions: 480,
    clef: "G",
    keySignature: { fifths: 0, mode: "major" },
    timeSignature: { beats: 4, beatType: 4 },
    initialTempoBpm: 120,
    title: "Test Score",
  };

  return buildMusicXml(chunk);
}
