/**
 * Key detection using Krumhansl-Schmuckler algorithm
 *
 * This estimates the key of a piece based on the distribution of pitch classes.
 * The algorithm compares the observed pitch class distribution to prototype
 * profiles for each major and minor key.
 */

import { midiPitchClass, type MidiNote, type KeySignature } from "./types";

// Krumhansl-Kessler key profiles (empirical weight profiles)
// These represent the typical distribution of pitch classes in each key
const MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];

const MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

// Sharps/flats names for key signature display
const KEY_NAMES = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "Ab",
  "Eb",
  "Bb",
  "F",
];

/**
 * Count occurrences of each pitch class (0-11) weighted by note duration
 */
function computePitchClassDistribution(notes: MidiNote[]): number[] {
  const counts = new Array(12).fill(0);

  for (const note of notes) {
    const pitchClass = midiPitchClass(note.pitch);
    // Weight by duration to give longer notes more influence
    const weight = Math.sqrt(note.duration);
    counts[pitchClass] += weight;
  }

  return counts;
}

/**
 * Normalize a vector to have zero mean
 */
function normalizeVector(vector: number[]): number[] {
  const mean = vector.reduce((a, b) => a + b, 0) / vector.length;
  return vector.map((v) => v - mean);
}

/**
 * Compute dot product of two vectors
 */
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Correlate two vectors (cosine similarity)
 */
function correlate(a: number[], b: number[]): number {
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct(a, b) / (normA * normB);
}

/**
 * Detect the key of a collection of notes
 */
export function detectKey(notes: MidiNote[]): KeySignature {
  // Filter out drum notes (they don't contribute to tonal key)
  const melodicNotes = notes.filter((n) => n.channel !== 9);

  if (melodicNotes.length === 0) {
    // No melodic notes found, default to C major
    return { fifths: 0, mode: "major" };
  }

  // Compute pitch class distribution
  const distribution = computePitchClassDistribution(melodicNotes);

  // Normalize the distribution
  const normalizedDist = normalizeVector(distribution);

  // Try all 24 possible keys (12 major, 12 minor)
  let bestKey: KeySignature = { fifths: 0, mode: "major" };
  let bestCorrelation = -Infinity;

  // Test major keys
  for (let root = 0; root < 12; root++) {
    // Rotate the major profile to start at this root
    const rotatedMajor = [...MAJOR_PROFILE.slice(root), ...MAJOR_PROFILE.slice(0, root)];
    const normalizedProfile = normalizeVector(rotatedMajor);
    const correlation = correlate(normalizedDist, normalizedProfile);

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      // Convert root (0-11) to fifths (-5 to +6)
      // 0=C→0, 1=G→1, 2=D→2, 3=A→3, 4=E→4, 5=B→5, 6=F#→6, 7=C#→7
      // 8=Ab→-4, 9=Eb→-3, 10=Bb→-2, 11=F→-1
      const fifthsMap = [0, 1, 2, 3, 4, 5, 6, 7, -4, -3, -2, -1];
      bestKey = { fifths: fifthsMap[root], mode: "major" };
    }
  }

  // Test minor keys
  for (let root = 0; root < 12; root++) {
    // Rotate the minor profile to start at this root
    const rotatedMinor = [...MINOR_PROFILE.slice(root), ...MINOR_PROFILE.slice(0, root)];
    const normalizedProfile = normalizeVector(rotatedMinor);
    const correlation = correlate(normalizedDist, normalizedProfile);

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      const fifthsMap = [0, 1, 2, 3, 4, 5, 6, 7, -4, -3, -2, -1];
      bestKey = { fifths: fifthsMap[root], mode: "minor" };
    }
  }

  return bestKey;
}

/**
 * Get the key name as a string (e.g., "C major", "F# minor")
 *
 * The fifths value represents the number of sharps (positive) or flats (negative).
 * For major keys, the tonic is the key with that many sharps/flats.
 * For minor keys, the tonic is the 6th degree of the relative major.
 *
 * In terms of the circle of fifths:
 * - Major tonic fifths position: the fifths value directly
 * - Minor tonic fifths position: (major fifths + 3) mod 12
 *
 * Examples:
 * - C major (0 sharps) → "C major", relative minor A (0 sharps) → "A minor"
 * - G major (1 sharp) → "G major", relative minor E (1 sharp) → "E minor"
 * - F major (1 flat) → "F major", relative minor D (1 flat) → "D minor"
 */
export function getKeyName(key: KeySignature): string {
  // Convert fifths to a 0-11 index for KEY_NAMES lookup
  // For negative values: -1 → 11, -2 → 10, -3 → 9, -4 → 8, -5 → 7
  const getKeyIndex = (f: number): number => {
    if (f >= 0) return f;
    return 12 + f;
  };

  const majorKeyIndex = getKeyIndex(key.fifths);
  const majorKeyName = KEY_NAMES[majorKeyIndex];

  if (key.mode === "major") {
    return `${majorKeyName} major`;
  }

  // For minor keys, the tonic is 3 fifths above the relative major
  // e.g., A minor (relative to C major, fifths=0): (0 + 3) % 12 = 3 → index 3 → KEY_NAMES[3] = "A"
  const minorTonicIndex = (majorKeyIndex + 3) % 12;
  const minorKeyName = KEY_NAMES[minorTonicIndex];

  return `${minorKeyName} minor`;
}

/**
 * Get the appropriate clef for a key signature
 * Keys with many sharps/flats might benefit from treble clef
 * but for simplicity we use G clef for most things
 * and F clef for very low ranges
 */
export function getClefForKey(
  notes: MidiNote[],
  defaultClef: "G" | "F" = "G"
): "G" | "F" {
  if (notes.length === 0) {
    return defaultClef;
  }

  // Calculate average pitch
  const avgPitch =
    notes.reduce((sum, n) => sum + n.pitch, 0) / notes.length;

  // If average pitch is below E3 (40), use bass clef
  if (avgPitch < 40) {
    return "F";
  }

  return "G";
}

/**
 * Determine the best clef based on pitch range
 */
export function determineClef(
  notes: MidiNote[]
): { clef: "G" | "F"; middleCFPosition?: number } {
  if (notes.length === 0) {
    return { clef: "G" };
  }

  // Get the range of pitches
  const pitches = notes.map((n) => n.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);

  // If the piece spans more than about 2 octaves and is mostly low, use F clef
  if (maxPitch < 60 && minPitch < 45) {
    return { clef: "F" };
  }

  // If the piece has very high notes but mostly middle range, use G clef
  return { clef: "G" };
}
