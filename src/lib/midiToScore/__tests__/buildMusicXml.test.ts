/**
 * Debug test - check the MusicXML output
 */

import { describe, it, expect } from "vitest";
import { buildMusicXml } from "../buildMusicXml";
import type { MeasureChunk, QuantizedNote } from "../types";

function createTestChunk(measureCount: number, notesPerMeasure: number): MeasureChunk {
  const measures = [];
  for (let i = 0; i < measureCount; i++) {
    const notes: QuantizedNote[] = [];
    for (let j = 0; j < notesPerMeasure; j++) {
      notes.push({
        pitch: 60, // Middle C
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
    parts: [
      {
        id: "P1",
        name: "Piano",
        clef: "G",
        keySignature: { fifths: 0, mode: "major" },
        isDrum: false,
        measures,
      },
    ],
    startMeasure: 1,
    endMeasure: measureCount,
    divisions: 480,
    clef: "G",
    keySignature: { fifths: 0, mode: "major" },
    timeSignature: { beats: 4, beatType: 4 },
    initialTempoBpm: 120,
    title: "Test Score",
  };
}

describe("buildMusicXml debug", () => {
  it("generates valid-looking MusicXML for 1 measure", () => {
    const chunk = createTestChunk(1, 4);
    const xml = buildMusicXml(chunk);

    console.log("Generated MusicXML:");
    console.log(xml);

    // Check basic structure
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("score-partwise");
    expect(xml).toContain("<measure");
    expect(xml).toContain("<note>");
    expect(xml).toContain("<pitch>");
    expect(xml).toContain("<divisions>480</divisions>");
    expect(xml).toContain("<fifths>0</fifths>");
    expect(xml).toContain("<beats>4</beats>");
    expect(xml).toContain("<sign>G</sign>");

    // Check that attributes are in the first measure
    const firstMeasureMatch = xml.match(/<measure number="1"[^>]*>([\s\S]*?)<\/measure>/);
    expect(firstMeasureMatch).toBeTruthy();
    const firstMeasureContent = firstMeasureMatch![1];
    expect(firstMeasureContent).toContain("<attributes>");
  });

  it("generates valid-looking MusicXML for 27 measures", () => {
    const chunk = createTestChunk(27, 1);
    const xml = buildMusicXml(chunk);

    console.log("Generated MusicXML (27 measures):");
    console.log(xml.substring(0, 2000) + "...");

    // Check that we have 27 measures
    const measureMatches = xml.match(/<measure number="\d+"/g);
    expect(measureMatches).toHaveLength(27);

    // Check attributes only in first measure
    const firstMeasureMatch = xml.match(/<measure number="1"[^>]*>([\s\S]*?)<\/measure>/);
    const firstMeasureContent = firstMeasureMatch![1];
    expect(firstMeasureContent).toContain("<attributes>");

    // Second measure should NOT have attributes
    const secondMeasureMatch = xml.match(/<measure number="2"[^>]*>([\s\S]*?)<\/measure>/);
    const secondMeasureContent = secondMeasureMatch![1];
    expect(secondMeasureContent).not.toContain("<attributes>");
  });

  it("handles empty measures", () => {
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
      title: "Empty Score",
    };

    const xml = buildMusicXml(chunk);
    console.log("Generated MusicXML (empty measure):");
    console.log(xml);

    // Should contain a rest note for empty measures
    expect(xml).toContain("<rest/>");
  });

  it("handles chord notes (multiple notes at same beat)", () => {
    // C major chord at beat 0
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
              notes: [
                // C major chord (C4, E4, G4) at beat 0
                {
                  pitch: 60, midiTime: 0, duration: 960, velocity: 80, channel: 0, track: 0,
                  quantizedStart: 0, quantizedDuration: 960, measure: 0, beat: 0,
                },
                {
                  pitch: 64, midiTime: 0, duration: 960, velocity: 80, channel: 0, track: 0,
                  quantizedStart: 0, quantizedDuration: 960, measure: 0, beat: 0,
                },
                {
                  pitch: 67, midiTime: 0, duration: 960, velocity: 80, channel: 0, track: 0,
                  quantizedStart: 0, quantizedDuration: 960, measure: 0, beat: 0,
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
      title: "Chord Test",
    };

    const xml = buildMusicXml(chunk);
    console.log("Generated MusicXML (chord):");
    console.log(xml);

    // First note should NOT have <chord/>, subsequent notes should
    const chordCount = (xml.match(/<chord\/>/g) || []).length
    expect(chordCount).toBe(2) // 2 chord notes (E4 and G4)

    // All notes should have pitch elements
    expect(xml).toContain("<step>C</step><octave>4</octave>")
    expect(xml).toContain("<step>E</step><octave>4</octave>")
    expect(xml).toContain("<step>G</step><octave>4</octave>")
  });
});
