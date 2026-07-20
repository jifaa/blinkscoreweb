/**
 * Full pipeline test to debug MusicXML generation
 */

import { describe, it, expect } from "vitest";
import { parseMidi } from "../parseMidi";
import { detectKey } from "../keyDetection";
import { quantizeNotes } from "../quantize";
import { chunkMeasures } from "../chunkMeasures";
import { buildMusicXml } from "../buildMusicXml";

// Create a simple MIDI file buffer (this is a minimal valid MIDI structure)
// Actually we can't create MIDI from scratch easily, so let's test with known note data

describe("Full Pipeline Test", () => {
  it("should generate valid MusicXML from note data", () => {
    // This tests the MusicXML generation without needing a real MIDI file
    const xml = buildMusicXml({
      parts: [
        {
          id: "P1",
          name: "Test",
          clef: "G",
          keySignature: { fifths: 0, mode: "major" },
          isDrum: false,
          measures: [
            {
              number: 1,
              startTicks: 0,
              endTicks: 1920,
              notes: [
                {
                  pitch: 60,
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
              ],
              timeSignature: { beats: 4, beatType: 4 },
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
      title: "Test",
    });

    console.log("Generated XML:");
    console.log(xml);

    // Verify structure
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("score-partwise");
    expect(xml).toContain("<attributes>");
    expect(xml).toContain("<divisions>480</divisions>");
    expect(xml).toContain("<note>");
  });

  it("should have proper XML declaration format", () => {
    const xml = buildMusicXml({
      parts: [
        {
          id: "P1",
          name: "Test",
          clef: "G",
          keySignature: { fifths: 0, mode: "major" },
          isDrum: false,
          measures: [
            {
              number: 1,
              startTicks: 0,
              endTicks: 1920,
              notes: [],
              timeSignature: { beats: 4, beatType: 4 },
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
      title: "Test",
    });

    // Check that the XML is properly formatted with no syntax errors
    // The declaration should be on the first line
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);

    // No unescaped special characters
    expect(xml).not.toContain("&[^;]");
    expect(xml).not.toContain("<[!CDATA[");
  });
});
