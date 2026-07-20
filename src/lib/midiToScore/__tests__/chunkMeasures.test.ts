/**
 * Tests for measure chunking logic
 */

import { describe, it, expect } from "vitest";
import {
  chunkMeasures,
  getChunkCount,
  getMeasureRangeForPage,
  validateChunks,
  getChunkMeasureCount,
  getChunkAtPage,
} from "../chunkMeasures";
import type { Part, Measure, QuantizedNote, DEFAULT_MEASURES_PER_PAGE } from "../types";

/**
 * Create a simple test part with a specified number of measures
 */
function createTestPart(measureCount: number, notesPerMeasure: number = 0): Part {
  const measures: Measure[] = [];

  for (let i = 0; i < measureCount; i++) {
    const notes: QuantizedNote[] = [];
    for (let j = 0; j < notesPerMeasure; j++) {
      notes.push({
        pitch: 60 + j, // C, D, E, ...
        midiTime: i * 1920 + j * 480,
        duration: 480,
        velocity: 80,
        channel: 0,
        track: 0,
        quantizedStart: i * 1920 + j * 480,
        quantizedDuration: 480,
        measure: i,
        beat: j,
      });
    }

    measures.push({
      number: i + 1,
      startTicks: i * 1920,
      endTicks: (i + 1) * 1920,
      notes,
      timeSignature: { beats: 4, beatType: 4 },
    });
  }

  return {
    id: "P1",
    name: "Piano",
    measures,
    clef: "G",
    keySignature: { fifths: 0, mode: "major" },
    isDrum: false,
  };
}

describe("chunkMeasures", () => {
  describe("with fewer than 27 measures", () => {
    it("creates a single chunk for a piece with 4 measures", () => {
      const part = createTestPart(4, 4);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].startMeasure).toBe(1);
      expect(chunks[0].endMeasure).toBe(4);
      expect(chunks[0].parts[0].measures).toHaveLength(4);
    });

    it("does not pad the last chunk with empty measures", () => {
      const part = createTestPart(5, 1);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].parts[0].measures).toHaveLength(5);
      expect(chunks[0].parts[0].measures[4].notes).toHaveLength(1);
    });

    it("handles a single measure piece", () => {
      const part = createTestPart(1, 4);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].startMeasure).toBe(1);
      expect(chunks[0].endMeasure).toBe(1);
    });
  });

  describe("with exactly 27 measures", () => {
    it("creates a single chunk", () => {
      const part = createTestPart(27, 4);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].startMeasure).toBe(1);
      expect(chunks[0].endMeasure).toBe(27);
    });
  });

  describe("with more than 27 measures", () => {
    it("creates two chunks for 28 measures", () => {
      const part = createTestPart(28, 4);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(2);
      expect(chunks[0].startMeasure).toBe(1);
      expect(chunks[0].endMeasure).toBe(27);
      expect(chunks[1].startMeasure).toBe(28);
      expect(chunks[1].endMeasure).toBe(28);
    });

    it("creates correct chunks for 54 measures", () => {
      const part = createTestPart(54, 4);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(2);
      expect(chunks[0].startMeasure).toBe(1);
      expect(chunks[0].endMeasure).toBe(27);
      expect(chunks[1].startMeasure).toBe(28);
      expect(chunks[1].endMeasure).toBe(54);
    });

    it("creates correct chunks for 55 measures (three chunks)", () => {
      const part = createTestPart(55, 4);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].startMeasure).toBe(1);
      expect(chunks[0].endMeasure).toBe(27);
      expect(chunks[1].startMeasure).toBe(28);
      expect(chunks[1].endMeasure).toBe(54);
      expect(chunks[2].startMeasure).toBe(55);
      expect(chunks[2].endMeasure).toBe(55);
    });

    it("preserves notes in each chunk correctly", () => {
      const part = createTestPart(30, 1);
      const chunks = chunkMeasures([part]);

      // First chunk should have 27 measures
      expect(chunks[0].parts[0].measures).toHaveLength(27);
      expect(chunks[0].parts[0].measures[0].notes[0].pitch).toBe(60);

      // Second chunk should have 3 measures
      expect(chunks[1].parts[0].measures).toHaveLength(3);
      expect(chunks[1].parts[0].measures[0].notes[0].pitch).toBe(60); // First note of chunk 2
    });

    it("handles very large pieces (100 measures)", () => {
      const part = createTestPart(100, 2);
      const chunks = chunkMeasures([part]);

      expect(chunks).toHaveLength(4); // 27 + 27 + 27 + 19
      expect(chunks[0].endMeasure).toBe(27);
      expect(chunks[1].endMeasure).toBe(54);
      expect(chunks[2].endMeasure).toBe(81);
      expect(chunks[3].endMeasure).toBe(100);
    });
  });

  describe("with multiple parts", () => {
    it("creates chunks with multiple parts", () => {
      const part1 = createTestPart(30, 4);
      const part2 = createTestPart(30, 4);
      part2.id = "P2";
      part2.name = "Right Hand";

      const chunks = chunkMeasures([part1, part2]);

      expect(chunks).toHaveLength(2);
      expect(chunks[0].parts).toHaveLength(2);
      expect(chunks[0].parts[0].measures).toHaveLength(27);
      expect(chunks[0].parts[1].measures).toHaveLength(27);
    });

    it("handles parts with different note counts", () => {
      const part1 = createTestPart(10, 4);
      const part2 = createTestPart(10, 0); // Empty part

      const chunks = chunkMeasures([part1, part2]);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].parts[0].measures).toHaveLength(10);
      expect(chunks[0].parts[1].measures).toHaveLength(10);
    });
  });

  describe("custom measuresPerPage", () => {
    it("uses custom measuresPerPage value", () => {
      const part = createTestPart(10, 4);
      const chunks = chunkMeasures([part], 1, { measuresPerPage: 5 });

      expect(chunks).toHaveLength(2);
      expect(chunks[0].endMeasure).toBe(5);
      expect(chunks[1].endMeasure).toBe(10);
    });

    it("handles custom page size of 1", () => {
      const part = createTestPart(3, 2);
      const chunks = chunkMeasures([part], 1, { measuresPerPage: 1 });

      expect(chunks).toHaveLength(3);
      chunks.forEach((chunk, i) => {
        expect(chunk.startMeasure).toBe(i + 1);
        expect(chunk.endMeasure).toBe(i + 1);
      });
    });
  });

  describe("with non-1 startMeasure offset", () => {
    it("adjusts measure numbers when starting from non-1", () => {
      const part = createTestPart(10, 4);
      const chunks = chunkMeasures([part], 5); // Start from measure 5

      expect(chunks).toHaveLength(1);
      expect(chunks[0].startMeasure).toBe(5);
      expect(chunks[0].endMeasure).toBe(14);
    });

    it("adjusts chunk boundaries with offset and custom size", () => {
      const part = createTestPart(30, 4);
      const chunks = chunkMeasures([part], 10, { measuresPerPage: 10 });

      expect(chunks).toHaveLength(3);
      expect(chunks[0].startMeasure).toBe(10);
      expect(chunks[0].endMeasure).toBe(19);
      expect(chunks[1].startMeasure).toBe(20);
      expect(chunks[1].endMeasure).toBe(29);
      expect(chunks[2].startMeasure).toBe(30);
      expect(chunks[2].endMeasure).toBe(39);
    });
  });

  describe("edge cases", () => {
    it("handles empty parts array", () => {
      const chunks = chunkMeasures([]);
      expect(chunks).toHaveLength(0);
    });

    it("handles part with 0 measures", () => {
      const emptyPart: Part = {
        id: "P1",
        name: "Empty",
        measures: [],
        clef: "G",
        keySignature: { fifths: 0, mode: "major" },
        isDrum: false,
      };
      const chunks = chunkMeasures([emptyPart]);
      expect(chunks).toHaveLength(0);
    });
  });
});

describe("getChunkCount", () => {
  it("returns 0 for 0 measures", () => {
    expect(getChunkCount(0)).toBe(0);
  });

  it("returns 1 for 1-27 measures", () => {
    expect(getChunkCount(1)).toBe(1);
    expect(getChunkCount(15)).toBe(1);
    expect(getChunkCount(27)).toBe(1);
  });

  it("returns 2 for 28-54 measures", () => {
    expect(getChunkCount(28)).toBe(2);
    expect(getChunkCount(54)).toBe(2);
  });

  it("returns 4 for 81-100 measures", () => {
    expect(getChunkCount(81)).toBe(3);
    expect(getChunkCount(82)).toBe(4);
  });

  it("uses custom measuresPerPage", () => {
    expect(getChunkCount(10, 5)).toBe(2);
    expect(getChunkCount(11, 5)).toBe(3);
  });
});

describe("getMeasureRangeForPage", () => {
  it("returns correct range for page 1", () => {
    const result = getMeasureRangeForPage(1, 50);
    expect(result.startMeasure).toBe(1);
    expect(result.endMeasure).toBe(27);
    expect(result.isLastPage).toBe(false);
  });

  it("returns correct range for page 2", () => {
    const result = getMeasureRangeForPage(2, 50);
    expect(result.startMeasure).toBe(28);
    expect(result.endMeasure).toBe(50);
    expect(result.isLastPage).toBe(true);
  });

  it("marks last page correctly", () => {
    const result1 = getMeasureRangeForPage(1, 27);
    expect(result1.isLastPage).toBe(true);

    const result2 = getMeasureRangeForPage(2, 50);
    expect(result2.isLastPage).toBe(true);

    const result3 = getMeasureRangeForPage(2, 54);
    expect(result3.isLastPage).toBe(true); // 54 = exactly 2 chunks, so page 2 IS the last
  });
});

describe("validateChunks", () => {
  it("returns true for empty chunks", () => {
    expect(validateChunks([])).toBe(true);
  });

  it("validates correct single chunk", () => {
    const part = createTestPart(5, 2);
    const chunks = chunkMeasures([part]);
    expect(validateChunks(chunks)).toBe(true);
  });

  it("validates correct multiple chunks", () => {
    const part = createTestPart(55, 2);
    const chunks = chunkMeasures([part]);
    expect(validateChunks(chunks)).toBe(true);
  });
});

describe("getChunkMeasureCount", () => {
  it("returns correct measure count for each chunk", () => {
    const part = createTestPart(55, 2);
    const chunks = chunkMeasures([part]);

    expect(getChunkMeasureCount(chunks[0])).toBe(27);
    expect(getChunkMeasureCount(chunks[1])).toBe(27);
    expect(getChunkMeasureCount(chunks[2])).toBe(1);
  });
});

describe("getChunkAtPage", () => {
  it("returns correct chunk for page 1", () => {
    const part = createTestPart(55, 2);
    const chunks = chunkMeasures([part]);

    const chunk = getChunkAtPage(chunks, 1);
    expect(chunk?.startMeasure).toBe(1);
    expect(chunk?.endMeasure).toBe(27);
  });

  it("returns correct chunk for page 3", () => {
    const part = createTestPart(55, 2);
    const chunks = chunkMeasures([part]);

    const chunk = getChunkAtPage(chunks, 3);
    expect(chunk?.startMeasure).toBe(55);
    expect(chunk?.endMeasure).toBe(55);
  });

  it("returns null for out-of-bounds page", () => {
    const part = createTestPart(10, 2);
    const chunks = chunkMeasures([part]);

    expect(getChunkAtPage(chunks, 0)).toBeNull();
    expect(getChunkAtPage(chunks, 5)).toBeNull();
  });
});
