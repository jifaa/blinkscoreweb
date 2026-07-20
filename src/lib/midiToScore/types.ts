/**
 * Shared types for MIDI-to-Score pipeline
 */

export type QuantGrid = "auto" | "1/8" | "1/16" | "1/32";

export type ClefType = "G" | "F" | "C";

export interface KeySignature {
  fifths: number; // -7 to 7 (flat to sharp)
  mode: "major" | "minor";
}

export interface MidiNote {
  pitch: number; // MIDI pitch number (0-127)
  midiTime: number; // Time in MIDI ticks (before quantization)
  duration: number; // Duration in MIDI ticks
  velocity: number; // 0-127
  channel: number;
  track: number;
}

export interface QuantizedNote extends MidiNote {
  quantizedStart: number; // Quantized start time in ticks
  quantizedDuration: number; // Quantized duration in ticks
  measure: number; // 0-indexed measure number
  beat: number; // Beat within measure (0-based, fractional)
}

export interface TimeSignatureEvent {
  ticks: number; // When this time signature takes effect
  beats: number; // numerator (e.g., 4)
  beatType: number; // denominator (e.g., 4)
}

export interface TempoEvent {
  ticks: number;
  bpm: number;
}

export interface Track {
  id: number;
  name: string;
  notes: MidiNote[];
  channel: number;
  isDrum: boolean;
}

export interface ParsedMidi {
  name: string;
  ppq: number; // Pulses per quarter note (ticks per beat)
  tracks: Track[];
  tempoEvents: TempoEvent[];
  timeSignatureEvents: TimeSignatureEvent[];
  initialTempoBpm: number;
}

export interface Measure {
  number: number; // 1-indexed for MusicXML
  startTicks: number;
  endTicks: number;
  notes: QuantizedNote[];
  timeSignature: { beats: number; beatType: number };
}

export interface Part {
  id: string;
  name: string;
  measures: Measure[];
  clef: ClefType;
  keySignature: KeySignature;
  isDrum: boolean;
}

export interface MeasureChunk {
  parts: Part[];
  startMeasure: number; // 1-indexed
  endMeasure: number; // 1-indexed
  divisions: number; // Ticks per quarter note for this chunk
  clef: ClefType;
  keySignature: KeySignature;
  timeSignature: { beats: number; beatType: number };
  initialTempoBpm: number;
  title?: string;
}

export interface ChunkOptions {
  measuresPerPage: number;
}

export const DEFAULT_MEASURES_PER_PAGE = 27;
export const DEFAULT_DIVISIONS = 480; // Standard MIDI ticks per quarter note
export const DEFAULT_TIME_SIGNATURE = { beats: 4, beatType: 4 };
export const DEFAULT_KEY_SIGNATURE: KeySignature = { fifths: 0, mode: "major" };

/**
 * Maps a MIDI pitch number to a pitch class (0-11)
 * 0 = C, 1 = C#, 2 = D, ... 11 = B
 */
export function midiPitchClass(pitch: number): number {
  return pitch % 12;
}

/**
 * Maps a MIDI pitch number to its octave
 * Middle C (60) = octave 4
 */
export function midiOctave(pitch: number): number {
  return Math.floor(pitch / 12) - 1;
}

/**
 * Converts a MIDI pitch to scientific pitch notation (e.g., "C4", "F#5")
 */
export function midiToScientificPitch(pitch: number): string {
  const pitchClasses = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = midiOctave(pitch);
  const pitchClass = midiPitchClass(pitch);
  return `${pitchClasses[pitchClass]}${octave}`;
}

/**
 * Converts MusicXML pitch format to MIDI pitch
 * MusicXML pitch: step (C D E F G A B), alter (-2 to 2), octave (0-9)
 */
export function scientificPitchToMidi(step: string, alter: number, octave: number): number {
  const steps: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const stepValue = steps[step] ?? 0;
  return (octave + 1) * 12 + stepValue + alter;
}
