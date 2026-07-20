/**
 * MIDI file parser — wraps @tonejs/midi into a clean intermediate representation
 */

import { Midi } from "@tonejs/midi";
import type {
  ParsedMidi,
  Track,
  MidiNote,
  TempoEvent,
  TimeSignatureEvent,
} from "./types";

/**
 * Parse a MIDI file (as ArrayBuffer) into a clean intermediate representation
 */
export async function parseMidi(buffer: ArrayBuffer): Promise<ParsedMidi> {
  const midi = new Midi(buffer);

  const name = midi.name || "Untitled";

  // Extract tempo events (convert from Tone.js format to our format)
  const tempoEvents: TempoEvent[] = midi.header.tempos.map((t) => ({
    ticks: Math.round(t.ticks),
    bpm: t.bpm,
  }));

  // Extract time signature events
  // Tone.js uses timeSignature: number[] where [0] = beats, [1] = beatType
  const timeSignatureEvents: TimeSignatureEvent[] = midi.header.timeSignatures.map(
    (ts) => ({
      ticks: Math.round(ts.ticks),
      beats: ts.timeSignature[0],
      beatType: ts.timeSignature[1],
    })
  );

  // If no time signature events, default to 4/4
  if (timeSignatureEvents.length === 0) {
    timeSignatureEvents.push({
      ticks: 0,
      beats: 4,
      beatType: 4,
    });
  }

  // Extract tracks and their notes
  const tracks: Track[] = midi.tracks.map((track, index) => {
    const notes: MidiNote[] = track.notes.map((note) => ({
      pitch: note.midi, // MIDI pitch number (0-127)
      midiTime: Math.round(note.ticks), // Start time in ticks
      duration: Math.round(note.durationTicks), // Duration in ticks
      velocity: Math.round(note.velocity * 127), // Convert 0-1 to 0-127
      channel: track.channel ?? 0,
      track: index,
    }));

    return {
      id: index,
      name: track.name || `Track ${index + 1}`,
      notes,
      channel: track.channel ?? 0,
      isDrum: track.channel === 9, // MIDI channel 10 (0-indexed as 9) is drums
    };
  });

  // Sort notes within each track by start time
  tracks.forEach((track) => {
    track.notes.sort((a, b) => a.midiTime - b.midiTime);
  });

  // Get initial tempo
  const initialTempoBpm =
    tempoEvents.length > 0 ? tempoEvents[0].bpm : 120;

  return {
    name,
    ppq: midi.header.ppq,
    tracks,
    tempoEvents,
    timeSignatureEvents,
    initialTempoBpm,
  };
}

/**
 * Get the tempo (BPM) at a specific tick position
 */
export function getTempoAtTick(
  midi: ParsedMidi,
  ticks: number
): number {
  let tempo = midi.initialTempoBpm;
  for (const event of midi.tempoEvents) {
    if (event.ticks <= ticks) {
      tempo = event.bpm;
    } else {
      break;
    }
  }
  return tempo;
}

/**
 * Get the time signature at a specific tick position
 */
export function getTimeSignatureAtTick(
  midi: ParsedMidi,
  ticks: number
): { beats: number; beatType: number } {
  let timeSig = { beats: 4, beatType: 4 };
  for (const event of midi.timeSignatureEvents) {
    if (event.ticks <= ticks) {
      timeSig = { beats: event.beats, beatType: event.beatType };
    } else {
      break;
    }
  }
  return timeSig;
}

/**
 * Convert ticks to seconds using the tempo map
 */
export function ticksToSeconds(
  midi: ParsedMidi,
  ticks: number
): number {
  // Simple conversion using ppq and current tempo
  // For accurate conversion with tempo changes, we'd need to accumulate
  const quarterNotes = ticks / midi.ppq;
  return (quarterNotes * 60) / midi.initialTempoBpm;
}

/**
 * Convert seconds to ticks
 */
export function secondsToTicks(
  midi: ParsedMidi,
  seconds: number
): number {
  const quarterNotes = (seconds * midi.initialTempoBpm) / 60;
  return Math.round(quarterNotes * midi.ppq);
}

/**
 * Get the duration of the MIDI file in ticks
 */
export function getMidiDuration(midi: ParsedMidi): number {
  let maxTicks = 0;
  for (const track of midi.tracks) {
    for (const note of track.notes) {
      const endTicks = note.midiTime + note.duration;
      if (endTicks > maxTicks) {
        maxTicks = endTicks;
      }
    }
  }
  return maxTicks;
}

/**
 * Flatten all notes from all tracks into a single array
 */
export function flattenNotes(midi: ParsedMidi): MidiNote[] {
  return midi.tracks.flatMap((track) => track.notes);
}
