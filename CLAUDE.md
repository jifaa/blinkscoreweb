@AGENTS.md

# CLAUDE.md

This file is the persistent reference for Claude Code in this repository. Read it fully before making changes. If something here conflicts with a one-off instruction in a prompt/task, treat this file as the standing rules and the task as the specific change on top of them.

## Project Overview

**BlinkScore** is a hands-free sheet-music reader for musicians. A right-eye wink turns to the next page; a left-eye wink turns to the previous page. It supports both **PDF** and **MIDI** files — MIDI files are converted to sheet music using a custom quantization pipeline and rendered with OpenSheetMusicDisplay (OSMD). All webcam/face processing and MIDI processing happens **entirely client-side** — no video, frame, or landmark data ever leaves the browser.

## Tech Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- **shadcn/ui** — all functional UI primitives (buttons, dialogs, sliders, forms, toasts)
- **ReactBits** — landing-page decoration *only*, never inside `/reader`
- **`@mediapipe/tasks-vision`** (Face Landmarker, WASM) — eye tracking, runs fully client-side
- **`@tonejs/midi`** — MIDI file parsing
- **`opensheetmusicdisplay`** (OSMD) — MusicXML rendering to sheet music
- **`react-pdf` / `pdfjs-dist`** — PDF rendering
- **Zustand** — app state; **`idb`** — local score library (IndexedDB)
- **`DESIGN.md`** (repo root) — single source of truth for every visual token in the app. See "Design System" below.

## Commands

```
npm run dev         # local dev server
npm run build        # production build
npm run lint          # eslint
npm run test         # vitest
npm run test:run     # vitest (run once)
```

## Architecture

```
src/
  app/
    page.tsx                  # landing page (ReactBits-heavy)
    reader/page.tsx            # main reader view (PDF or MIDI + camera)
  components/
    ui/                       # shadcn primitives — re-skinned per DESIGN.md
    landing/                  # ReactBits-based marketing sections
    reader/
      PdfViewer.tsx           # PDF rendering with pdfjs-dist
      MidiScoreViewer.tsx      # MIDI score rendering with OSMD
      MidiUpload.tsx          # MIDI upload with grid control
      UnifiedUpload.tsx       # PDF/MIDI unified upload
      CameraPreview.tsx        # Camera preview with face tracking overlay
      CalibrationWizard.tsx    # Eye wink calibration flow
      SettingsPanel.tsx        # Settings configuration panel
      NavigationControls.tsx  # Page navigation (PDF + MIDI)
      Library.tsx             # PDF/MIDI library management
      WinkNavigator.tsx       # Wink detection and page navigation
  lib/
    midiToScore/              # MIDI-to-Score pipeline
      types.ts                # Shared TypeScript interfaces
      parseMidi.ts            # Wrap @tonejs/midi into clean representation
      keyDetection.ts         # Krumhansl-Schmuckler key estimation
      quantize.ts             # Timing quantization + measure grouping
      chunkMeasures.ts        # 27-measure chunking logic
      buildMusicXml.ts        # MusicXML generation per chunk
    faceTracking/
      faceLandmarker.ts       # MediaPipe setup + inference loop
      winkClassifier.ts       # left/right wink logic — see below, most bug-prone file
    pdf/renderPage.ts
    storage/db.ts            # IndexedDB wrapper (PDF + MIDI library)
  store/
    useReaderStore.ts        # Unified state for PDF and MIDI modes
```

## Critical Domain Logic — Wink vs Blink (do not regress this)

A normal blink closes **both eyes at once**. If navigation fires on "right eye closed" alone, every ordinary blink misfires as a page turn. The classifier in `lib/faceTracking/winkClassifier.ts` must always check both eyes' `eyeBlinkLeft`/`eyeBlinkRight` MediaPipe blendshape scores and require **asymmetry**, not just one high value:

- `rightWink = eyeBlinkRight > HIGH && eyeBlinkLeft < LOW`
- `leftWink = eyeBlinkLeft > HIGH && eyeBlinkRight < LOW`
- Both scores high at once → normal blink → ignore, never navigate.
- Require the asymmetric state to hold ~120–250ms before counting it (filters noise), then apply a cooldown (~700ms–1s, user-adjustable) before accepting the next trigger.
- `HIGH`/`LOW` thresholds come from the per-user calibration wizard, not hardcoded constants — different people have different baseline eye openness and wink strength.

Any change to this file needs a `/tdd` pass first, with fixtures covering: both-eyes-closed, right-only, left-only, and noisy/flickery input. This is the single most bug-prone piece of logic in the app — treat changes here with more scrutiny than anywhere else.

## Critical Domain Logic — MIDI Quantization Pipeline (do not regress this)

The MIDI-to-Score pipeline in `src/lib/midiToScore/` is the second most bug-prone part of the app. It converts raw MIDI data into rendered sheet music. The critical invariants are:

### 27 Measures Per Page (hard cap)
- `MEASURES_PER_PAGE = 27` is defined as a named constant in `chunkMeasures.ts` — it's not OSMD's auto-pagination
- Each page renders exactly 27 measures (except possibly the last page, which may have fewer)
- Each page is a **separate, self-contained MusicXML document** — not a slice of one big document

### Self-Contained MusicXML Chunks
A naive slice of "measures 28–54" dropped out of a full MusicXML will be missing clef/key/time signature attributes, which in a full document only appear in measure 1. Every MusicXML chunk **must re-declare `<attributes>` at its first measure**, including:
- `<divisions>` (ticks per quarter note)
- `<key>` (fifths, mode)
- `<time>` (beats, beat-type)
- `<clef>` (sign, line)

### Fit-to-Height Rendering
Each MIDI page must fit the viewport height without scrolling. After OSMD renders, auto-calculate `zoom = containerHeight / svgHeight` and apply via `osmd.zoom = zoom`. Cap zoom at 1.0 to avoid upscaling.

### Pipeline Order
1. `parseMidi.ts` — parse MIDI to notes/tempo/time-signature events
2. `keyDetection.ts` — estimate key signature via Krumhansl-Schmuckler
3. `quantize.ts` — snap note timings to grid, group into measures
4. `chunkMeasures.ts` — chunk into 27-measure groups
5. `buildMusicXml.ts` — generate valid standalone MusicXML per chunk

Any change to `quantize.ts`, `keyDetection.ts`, or `chunkMeasures.ts` needs a `/tdd` pass with fixtures covering:
- Monophonic MIDI, already quantized
- Polyphonic/chordal MIDI
- MIDI with mid-piece tempo or time-signature change
- MIDI with **no** time-signature meta event (must default to 4/4)
- MIDI with >27 measures (verify correct chunk boundaries)
- MIDI with <27 measures (single page, no padding)

## Reader Store — ContentType Gate

`useReaderStore.ts` uses `contentType: 'pdf' | 'midi' | null` to determine which viewer to show. The navigation actions (`nextPage`, `prevPage`, `currentPage`, `totalPages`) are renderer-agnostic — they work for both PDF pages and MIDI chunks without any fork.

**WinkNavigator.tsx needs zero changes for MIDI support.** It only calls `nextPage()`/`prevPage()`.

Fit Mode controls in `NavigationControls.tsx` are hidden for MIDI mode (`contentType === 'midi'`) since the MIDI viewer handles its own fit-to-height scaling.

## Design System — `DESIGN.md` Governs Everything

- Every color/type/radius/spacing value in the app must trace back to a token in `DESIGN.md`, mapped once into CSS variables + `tailwind.config.ts`. No hardcoded hex anywhere else.
- The accent color is reserved for exactly three things: the primary CTA, focus rings, and the on-screen flash when a wink triggers a page turn. It is never decorative.
- The reader view (`/reader`) stays minimal, high-contrast, and distraction-free regardless of how expressive the landing page gets. Landing-page visual richness (ReactBits, motion) must never leak into `/reader`.
- If `DESIGN.md` doesn't define a light mode, don't invent one — flag it back to the user instead of assuming.

## Non-Negotiables

- **Privacy**: no video frame, image, landmark, MIDI, or score data is ever sent to a server. All processing is 100% client-side.
- **Manual fallback always works**: on-screen buttons, keyboard arrows, edge-click navigation must function fully independent of the camera — this is not a secondary feature, camera control is the enhancement.
- **Accessibility**: fallback controls stay keyboard-operable and screen-reader-labeled through any restyling.
- **Performance**: inference throttled to ~15–20fps; avoid heavy blur/shadow/animation in the reader view — this runs on a laptop/tablet during a live performance, battery and frame rate matter.
- **Browser caveat**: iOS Safari has webcam/autoplay quirks — surface a clear warning rather than failing silently if detection can't start.

## Tooling Available in This Repo

- **CodeGraph** (MCP, already indexed) — use its context/search/callers/impact tools to explore how the codebase connects instead of manually grepping, especially around `faceTracking/`, `midiToScore/`, and `reader/`.
- **mattpocock/skills** plugin installed — use `/tdd` for any change to `winkClassifier.ts`, `quantize.ts`, `keyDetection.ts`, or `chunkMeasures.ts`.
- **Vitest** configured for unit tests in `src/lib/midiToScore/__tests__/`.
- **browser-use** — for E2E smoke tests of everything that doesn't require real camera input: PDF/MIDI upload, settings panel, keyboard fallback nav, responsive breakpoints.

## Conventions

- No hardcoded hex/colors outside the `DESIGN.md`-derived theme layer.
- All camera/vision logic lives in `lib/faceTracking/`, never inline inside components.
- All MIDI processing logic lives in `lib/midiToScore/`, never inline inside components.
- New UI primitives go through `components/ui` (shadcn) before being reused elsewhere.
- `MEASURES_PER_PAGE = 27` is the single constant controlling page chunking — don't scatter this value.

## Common Pitfalls to Avoid

- Triggering navigation on a normal (both-eyes) blink instead of a true asymmetric wink.
- Letting landing-page decoration (motion, gradients, ReactBits) leak into `/reader`.
- Removing focus states or accessibility labels while restyling.
- Adding a backend/database "just to store PDFs/MIDI" — this app is intentionally client-only.
- Forgetting to re-declare `<attributes>` at the start of each MusicXML chunk (causes missing clefs/keys).
- Forgetting to calculate MIDI duration from actual note data (`midi.duration` is in seconds, not ticks).
- Assuming a light theme is wanted when `DESIGN.md` doesn't specify one.
