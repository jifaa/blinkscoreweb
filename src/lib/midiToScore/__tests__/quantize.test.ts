/**
 * Tests for quantization and measure grouping logic
 *
 * These tests verify the quantization pipeline transforms MIDI data
 * into a measure-by-measure structure suitable for MusicXML generation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { quantizeNotes } from "../quantize";
import type { ParsedMidi, MidiNote, Track, TempoEvent, TimeSignatureEvent } from "../types";

/**
 * Create a minimal ParsedMidi object for testing
 */
function createTestMidi(
  notes: MidiNote[],
  options: {
    ppq?: number;
    tempo?: number;
    timeSignatures?: TimeSignatureEvent[];
    name?: string;
  } = {}
): ParsedMidi {
  const ppq = options.ppq ?? 480;
  const track: Track = {
    id: 0,
    name: "Test Track",
    notes: notes.map((n) => ({ ...n, duration: n.duration })),
    channel: 0,
    isDrum: false,
  };

  return {
    name: options.name ?? "Test",
    ppq,
    tracks: [track],
    tempoEvents: options.tempo ? [{ ticks: 0, bpm: options.tempo }] : [],
    timeSignatureEvents: options.timeSignatures ?? [{ ticks: 0, beats: 4, beatType: 4 }],
    initialTempoBpm: options.tempo ?? 120,
  };
}

describe("quantizeNotes", () => {
  describe("basic quantization with 4/4 time", () => {
    it("quantizes notes to quarter note grid in 4/4", () => {
      // 4 quarter notes in a measure
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 0, duration: 480, velocity: 80, channel: 0, track: 0 },
        { pitch: 62, midiTime: 480, duration: 480, velocity: 80, channel: 0, track: 0 },
        { pitch: 64, midiTime: 960, duration: 480, velocity: 80, channel: 0, track: 0 },
        { pitch: 65, midiTime: 1440, duration: 480, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts).toHaveLength(1);
      expect(parts[0].measures).toHaveLength(1);
      expect(parts[0].measures[0].notes).toHaveLength(4);
      expect(parts[0].measures[0].timeSignature).toEqual({ beats: 4, beatType: 4 });
    });

    it("groups notes into correct measures", () => {
      // 8 quarter notes spanning 2 measures
      const notes: MidiNote[] = [];
      for (let i = 0; i < 8; i++) {
        notes.push({ pitch: 60 + i, midiTime: i * 480, duration: 480, velocity: 80, channel: 0, track: 0 });
      }

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].measures).toHaveLength(2);
      expect(parts[0].measures[0].notes).toHaveLength(4);
      expect(parts[0].measures[1].notes).toHaveLength(4);
    });

    it("handles notes already on grid (pre-quantized MIDI)", () => {
      // Notes already perfectly quantized
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 0, duration: 960, velocity: 80, channel: 0, track: 0 }, // half note
        { pitch: 62, midiTime: 960, duration: 480, velocity: 80, channel: 0, track: 0 }, // quarter
        { pitch: 64, midiTime: 1440, duration: 960, velocity: 80, channel: 0, track: 0 }, // half
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].measures[0].notes[0].quantizedStart).toBe(0);
      expect(parts[0].measures[0].notes[1].quantizedStart).toBe(960);
      expect(parts[0].measures[0].notes[2].quantizedStart).toBe(1440);
    });

    it("assigns correct beat positions within measures", () => {
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 0, duration: 480, velocity: 80, channel: 0, track: 0 }, // beat 0
        { pitch: 62, midiTime: 480, duration: 480, velocity: 80, channel: 0, track: 0 }, // beat 1
        { pitch: 64, midiTime: 960, duration: 480, velocity: 80, channel: 0, track: 0 }, // beat 2
        { pitch: 65, midiTime: 1440, duration: 480, velocity: 80, channel: 0, track: 0 }, // beat 3
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].measures[0].notes[0].beat).toBe(0);
      expect(parts[0].measures[0].notes[1].beat).toBe(1);
      expect(parts[0].measures[0].notes[2].beat).toBe(2);
      expect(parts[0].measures[0].notes[3].beat).toBe(3);
    });
  });

  describe("3/4 time signature", () => {
    it("creates measures with 3 beats each", () => {
      const notes: MidiNote[] = [];
      for (let i = 0; i < 6; i++) {
        notes.push({ pitch: 60, midiTime: i * 480, duration: 480, velocity: 80, channel: 0, track: 0 });
      }

      const midi = createTestMidi(notes, {
        ppq: 480,
        timeSignatures: [{ ticks: 0, beats: 3, beatType: 4 }],
      });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].measures).toHaveLength(2);
      expect(parts[0].measures[0].notes).toHaveLength(3);
      expect(parts[0].measures[1].notes).toHaveLength(3);
      expect(parts[0].measures[0].timeSignature).toEqual({ beats: 3, beatType: 4 });
    });
  });

  describe("6/8 time signature", () => {
    it("creates measures with 6 eighth notes (3 quarter-note equivalents)", () => {
      const notes: MidiNote[] = [];
      // 6 eighth notes in 6/8 = one measure
      for (let i = 0; i < 6; i++) {
        notes.push({ pitch: 60, midiTime: i * 240, duration: 240, velocity: 80, channel: 0, track: 0 });
      }

      const midi = createTestMidi(notes, {
        ppq: 480,
        timeSignatures: [{ ticks: 0, beats: 6, beatType: 8 }],
      });
      const { parts } = quantizeNotes(midi, "1/16");

      expect(parts[0].measures).toHaveLength(1);
      expect(parts[0].measures[0].notes).toHaveLength(6);
      expect(parts[0].measures[0].timeSignature).toEqual({ beats: 6, beatType: 8 });
    });
  });

  describe("mid-piece time signature change", () => {
    it("creates separate measures at time signature boundary", () => {
      const notes: MidiNote[] = [];
      // 8 quarter notes total
      for (let i = 0; i < 8; i++) {
        notes.push({ pitch: 60, midiTime: i * 480, duration: 480, velocity: 80, channel: 0, track: 0 });
      }

      // Change from 4/4 to 3/4 at measure 2 boundary (tick 1920)
      const midi = createTestMidi(notes, {
        ppq: 480,
        timeSignatures: [
          { ticks: 0, beats: 4, beatType: 4 },
          { ticks: 1920, beats: 3, beatType: 4 },
        ],
      });
      const { parts } = quantizeNotes(midi, "1/8");

      // Should have 3 measures: 4/4 measure, then two 3/4 measures
      expect(parts[0].measures).toHaveLength(3);
      expect(parts[0].measures[0].notes).toHaveLength(4); // 4/4
      expect(parts[0].measures[0].timeSignature).toEqual({ beats: 4, beatType: 4 });
      expect(parts[0].measures[1].notes).toHaveLength(3); // First 3/4
      expect(parts[0].measures[1].timeSignature).toEqual({ beats: 3, beatType: 4 });
      expect(parts[0].measures[2].notes).toHaveLength(1); // Last 3/4 (one note remaining)
      expect(parts[0].measures[2].timeSignature).toEqual({ beats: 3, beatType: 4 });
    });
  });

  describe("missing time signature", () => {
    it("falls back to 4/4 when no time signature meta event", () => {
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 0, duration: 480, velocity: 80, channel: 0, track: 0 },
        { pitch: 62, midiTime: 480, duration: 480, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, {
        ppq: 480,
        timeSignatures: [], // No time signature
      });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].measures[0].timeSignature).toEqual({ beats: 4, beatType: 4 });
    });
  });

  describe("polyphonic MIDI (multiple tracks)", () => {
    it("creates separate parts for each track", () => {
      const track1Notes: MidiNote[] = [
        { pitch: 60, midiTime: 0, duration: 480, velocity: 80, channel: 0, track: 0 },
        { pitch: 64, midiTime: 480, duration: 480, velocity: 80, channel: 0, track: 0 },
      ];

      const track2Notes: MidiNote[] = [
        { pitch: 48, midiTime: 0, duration: 960, velocity: 80, channel: 1, track: 1 },
      ];

      const midi: ParsedMidi = {
        name: "Poly",
        ppq: 480,
        tracks: [
          { id: 0, name: "Melody", notes: track1Notes, channel: 0, isDrum: false },
          { id: 1, name: "Bass", notes: track2Notes, channel: 1, isDrum: false },
        ],
        tempoEvents: [],
        timeSignatureEvents: [{ ticks: 0, beats: 4, beatType: 4 }],
        initialTempoBpm: 120,
      };

      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts).toHaveLength(2);
      expect(parts[0].name).toBe("Part 1");
      expect(parts[1].name).toBe("Part 2");
    });

    it("handles chord (simultaneous notes) in same part", () => {
      // C major chord (C E G) all starting at the same time
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 0, duration: 1920, velocity: 80, channel: 0, track: 0 },
        { pitch: 64, midiTime: 0, duration: 1920, velocity: 80, channel: 0, track: 0 },
        { pitch: 67, midiTime: 0, duration: 1920, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].measures[0].notes).toHaveLength(3);
      expect(parts[0].measures[0].notes.map((n) => n.pitch)).toEqual([60, 64, 67]);
    });
  });

  describe("grid quantization levels", () => {
    it("quantizes to eighth note grid", () => {
      const notes: MidiNote[] = [
        // Off-grid note (should snap to nearest eighth)
        { pitch: 60, midiTime: 100, duration: 200, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      // 100 should snap to 0 (nearest eighth at 240 ticks)
      // Actually with grid size 240, 100 is closer to 0
      expect(parts[0].measures[0].notes[0].quantizedStart).toBe(0);
    });

    it("quantizes to sixteenth note grid", () => {
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 100, duration: 200, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/16");

      // 100 should snap to 120 (nearest 16th at 120 ticks)
      expect(parts[0].measures[0].notes[0].quantizedStart).toBe(120);
    });

    it("quantizes to thirty-second note grid", () => {
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 100, duration: 100, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/32");

      // 100 should snap to 120 (nearest 32nd at 60 ticks, but with rounding)
      const quantized = parts[0].measures[0].notes[0].quantizedStart;
      expect(quantized % 60).toBe(0); // Should be on 32nd grid (60 ticks)
    });
  });

  describe("clef determination", () => {
    it("assigns G clef for treble range", () => {
      const notes: MidiNote[] = [
        { pitch: 60, midiTime: 0, duration: 480, velocity: 80, channel: 0, track: 0 },
        { pitch: 72, midiTime: 480, duration: 480, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].clef).toBe("G");
    });

    it("assigns F clef for bass range", () => {
      const notes: MidiNote[] = [
        { pitch: 36, midiTime: 0, duration: 480, velocity: 80, channel: 0, track: 0 },
        { pitch: 43, midiTime: 480, duration: 480, velocity: 80, channel: 0, track: 0 },
      ];

      const midi = createTestMidi(notes, { ppq: 480 });
      const { parts } = quantizeNotes(midi, "1/8");

      expect(parts[0].clef).toBe("F");
    });
  });

  describe("measure boundaries", () => {
    it("returns correct measure boundaries", () => {
      const notes: MidiNote[] = [];
      for (let i = 0; i < 8; i++) {
        notes.push({ pitch: 60, midiTime: i * 480, duration: 480, velocity: 80, channel: 0, track: 0 });
      }

      const midi = createTestMidi(notes, { ppq: 480 });
      const { measureBoundaries } = quantizeNotes(midi, "1/8");

      expect(measureBoundaries).toHaveLength(2);
      expect(measureBoundaries[0].start).toBe(0);
      expect(measureBoundaries[0].end).toBe(1920);
      expect(measureBoundaries[1].start).toBe(1920);
      expect(measureBoundaries[1].end).toBe(3840);
    });
  });

  describe("empty MIDI", () => {
    it("handles MIDI with no notes", () => {
      const midi = createTestMidi([], { ppq: 480 });
      const { parts, measureBoundaries } = quantizeNotes(midi, "1/8");

      // Should create at least one measure to show the time signature
      expect(parts[0].measures.length).toBeGreaterThanOrEqual(1);
    });
  });
});
