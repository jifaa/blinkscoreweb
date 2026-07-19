@AGENTS.md

# CLAUDE.md

This file is the persistent reference for Claude Code in this repository. Read it fully before making changes. If something here conflicts with a one-off instruction in a prompt/task, treat this file as the standing rules and the task as the specific change on top of them.

## Project Overview

**BlinkScore** is a hands-free PDF sheet-music reader for musicians. A right-eye wink turns to the next page; a left-eye wink turns to the previous page. All webcam/face processing happens **entirely client-side** — no video, frame, or landmark data ever leaves the browser.

## Tech Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- **shadcn/ui** — all functional UI primitives (buttons, dialogs, sliders, forms, toasts)
- **ReactBits** — landing-page decoration *only*, never inside `/reader`
- **`@mediapipe/tasks-vision`** (Face Landmarker, WASM) — eye tracking, runs fully client-side
- **`react-pdf` / `pdfjs-dist`** — PDF rendering
- **Zustand** — app state; **`idb`** — optional local score library (IndexedDB)
- **`DESIGN.md`** (repo root) — single source of truth for every visual token in the app. See "Design System" below.

## Commands

```
npm run dev         # local dev server
npm run build        # production build
npm run lint          # eslint
npm run typecheck   # tsc --noEmit
```
Adjust these to whatever `package.json` actually defines if it has diverged — don't assume without checking.

## Architecture

```
src/
  app/
    page.tsx                  # landing page (ReactBits-heavy)
    reader/page.tsx            # main PDF + camera reader view
  components/
    ui/                       # shadcn primitives — re-skinned per DESIGN.md
    landing/                  # ReactBits-based marketing sections
    reader/
      PdfViewer.tsx
      CameraPreview.tsx
      CalibrationWizard.tsx
      SettingsPanel.tsx
      NavigationControls.tsx
  lib/
    faceTracking/
      faceLandmarker.ts        # MediaPipe setup + inference loop
      winkClassifier.ts        # left/right wink logic — see below, most bug-prone file in the repo
    pdf/renderPage.ts
    storage/db.ts               # idb wrapper for the library feature
  store/
    useReaderStore.ts           # page, calibration, settings, camera status
```

## Critical Domain Logic — Wink vs Blink (do not regress this)

A normal blink closes **both eyes at once**. If navigation fires on "right eye closed" alone, every ordinary blink misfires as a page turn. The classifier in `lib/faceTracking/winkClassifier.ts` must always check both eyes' `eyeBlinkLeft`/`eyeBlinkRight` MediaPipe blendshape scores and require **asymmetry**, not just one high value:

- `rightWink = eyeBlinkRight > HIGH && eyeBlinkLeft < LOW`
- `leftWink = eyeBlinkLeft > HIGH && eyeBlinkRight < LOW`
- Both scores high at once → normal blink → ignore, never navigate.
- Require the asymmetric state to hold ~120–250ms before counting it (filters noise), then apply a cooldown (~700ms–1s, user-adjustable) before accepting the next trigger.
- `HIGH`/`LOW` thresholds come from the per-user calibration wizard, not hardcoded constants — different people have different baseline eye openness and wink strength.

Any change to this file needs a `/tdd` pass first, with fixtures covering: both-eyes-closed, right-only, left-only, and noisy/flickery input. This is the single most bug-prone piece of logic in the app — treat changes here with more scrutiny than anywhere else.

## Design System — `DESIGN.md` Governs Everything

- Every color/type/radius/spacing value in the app must trace back to a token in `DESIGN.md`, mapped once into CSS variables + `tailwind.config.ts`. No hardcoded hex anywhere else. See `THEME.md` for the current token mapping.
- The accent color is reserved for exactly three things: the primary CTA, focus rings, and the on-screen flash when a wink triggers a page turn. It is never decorative.
- The reader view (`/reader`) stays minimal, high-contrast, and distraction-free regardless of how expressive the landing page gets. Landing-page visual richness (ReactBits, motion) must never leak into `/reader`.
- If `DESIGN.md` doesn't define a light mode, don't invent one — flag it back to the user instead of assuming.

## Non-Negotiables

- **Privacy**: no video frame, image, or landmark data is ever sent to a server. This app has no backend/database for its core flow, by design.
- **Manual fallback always works**: on-screen buttons, keyboard arrows, edge-click navigation must function fully independent of the camera — this is not a secondary feature, camera control is the enhancement.
- **Accessibility**: fallback controls stay keyboard-operable and screen-reader-labeled through any restyling.
- **Performance**: inference throttled to ~15–20fps; avoid heavy blur/shadow/animation in the reader view — this runs on a laptop/tablet during a live performance, battery and frame rate matter.
- **Browser caveat**: iOS Safari has webcam/autoplay quirks — surface a clear warning rather than failing silently if detection can't start.

## Tooling Available in This Repo

- **CodeGraph** (MCP, already indexed) — use its context/search/callers/impact tools to explore how the codebase connects instead of manually grepping, especially around `faceTracking/` and `reader/`.
- **mattpocock/skills** plugin installed — use `/tdd` for any change to `winkClassifier.ts`, `/diagnosing-bugs` if camera/landmark detection behaves inconsistently, `/code-review` before considering any change done.
- **browser-use** — for E2E smoke tests of everything that doesn't require real camera input: PDF upload, settings panel, keyboard fallback nav, responsive breakpoints. It cannot simulate an actual wink, so camera-dependent behavior still needs manual verification by a human.

## Conventions

- No hardcoded hex/colors outside the `DESIGN.md`-derived theme layer.
- All camera/vision logic lives in `lib/faceTracking/`, never inline inside components.
- New UI primitives go through `components/ui` (shadcn) before being reused elsewhere.

## Common Pitfalls to Avoid

- Triggering navigation on a normal (both-eyes) blink instead of a true asymmetric wink.
- Letting landing-page decoration (motion, gradients, ReactBits) leak into `/reader`.
- Removing focus states or accessibility labels while restyling.
- Adding a backend/database "just to store PDFs" — this app is intentionally client-only.
- Assuming a light theme is wanted when `DESIGN.md` doesn't specify one.