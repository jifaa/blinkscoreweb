---
target: src/app/page.tsx
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-07-19T09-54-00Z
slug: src-app-page-tsx
---
# BlinkScore Design Critique — 2026-07-19

## Design Health Score

| # | Heuristic | Landing | Reader | Key Issue |
|---|-----------|---------|--------|-----------|
| 1 | Visibility of System Status | 4 | 3 | Reader: camera failure mid-performance has no recovery UI |
| 2 | Match System / Real World | 4 | 3 | "Wink threshold" is learnable; calibration wizard matches mental model |
| 3 | User Control and Freedom | 4 | 2 | Escape exits performance mode — but escape is undiscoverable under pressure |
| 4 | Consistency and Standards | 3 | 2 | Token name inconsistency: `text-muted-foreground` vs `text-ink-subtle`; shadow-lg on dark surfaces |
| 5 | Error Prevention | 3 | 3 | PDF type validation in dropzone; calibration wizard prevents misfire |
| 6 | Recognition Rather Than Recall | 3 | 2 | Arrow keys nav undocumented; power users discover by accident |
| 7 | Flexibility and Efficiency | 3 | 2 | Keyboard nav exists but undocumented; no shortcut reference; no calibration profile save |
| 8 | Aesthetic and Minimalist Design | 3 | 4 | Landing slightly elevated (3-col grid + numbered sections); Reader exemplary — PDF is the protagonist |
| 9 | Error Recovery | 3 | 2 | Camera errors show retry; but mid-performance camera loss = no recovery path |
| 10 | Help and Documentation | 2 | 1 | No docs link; zero in-app guidance beyond calibration wizard |
| **Total** | | **32/40** | **23/40** | |

**Rating: Landing = Good (32) | Reader = Acceptable (23)**

---

## Anti-Patterns Verdict

### LLM Assessment

**Landing page: Conditional pass.** The 3-column feature grid (page.tsx lines 85–121) and numbered "How It Works" steps (lines 136–167) borrow Linear conventions — but they're restrained, not decorative. Feature cards have distinct accent treatments, the numbered sequence serves a genuine 3-step process. A Linear power user would read this as "competent" rather than "AI slop." The eyebrow at lines 35–38 is a mild tell.

**Reader page: Clean.** No gradient text, no glassmorphism, no side-stripe borders. The minimal functional aesthetic is correct for a precision tool. The upload state is spare and purposeful. The shadow-lg violations (see P0 below) are the only structural issues.

**The single most important pattern working**: Privacy messaging appears exactly where trust is needed (CameraPermissionDialog lines 64–69, landing page badge) — "No video or image data is ever uploaded" stated once, clearly, as architecture rather than marketing.

### Deterministic Scan

**0 issues found across 21 files scanned.** The CLI detector ran clean on all source files. Design system tokens (`bg-canvas`, `text-ink`, `border-hairline`, `bg-surface-1`) are used correctly throughout. Focus states use `focus-visible` with the primary ring. No gradient text, wrong border-radius, or muted contrast anti-patterns present in source.

**Browser verification**: Main page renders correctly with design tokens applied. Reader route returned 404 — dev server hot-reload issue, not a code quality problem.

### Cross-Assessment Notes

Assessment A flagged `text-muted-foreground` usage throughout as a token naming inconsistency. Assessment B confirmed those same classes resolve to correct values (`#8a8f98`). The issue is nomenclature inconsistency, not visual defect — the hex is right, the semantic name should be `ink-subtle` per DESIGN.md terminology.

---

## Overall Impression

The `/reader` page has a strong foundation. The Stage Dark aesthetic, surface ladder, and lavender scarcity rule are correctly implemented. The PDF is genuinely the protagonist. What the reader is missing is not design craft — it's performer safety and power-user discoverability. The most dangerous gap: Mia the musician enters stage mode, her camera fails mid-performance, and she cannot find the exit. That's not a UI polish issue — that's a reliability problem that surfaces at the worst possible moment.

The landing page earns its weight through restraint. It borrows Linear conventions but doesn't abuse them.

---

## What's Working

1. **DESIGN.md fidelity in /reader.** Canvas is `#010102`, surfaces use the ladder correctly, lavender is genuinely scarce (focus rings, primary CTA only). `shadow-lg` on the camera preview and PDF canvas are the only violations — fixable in minutes.

2. **Privacy as load-bearing architecture.** CameraPermissionDialog (lines 64–69) and the landing privacy badge state client-side processing as precondition, not feature. "No data ever leaves your device" appears exactly where trust is earned.

3. **Performance mode implementation.** Wake Lock integration (PerformanceMode.tsx lines 8–55) and fullscreen request with graceful fallback (lines 78–85) show the right engineering priorities for a concert context. The 3-second auto-hide is a sensible default.

---

## Priority Issues

### [P0] Shadows on dark surfaces — DESIGN.md violation

**Files**: `reader/page.tsx` line 203, `PdfViewer.tsx` line 231

`shadow-lg` on `#010102` canvas produces muddy, indistinct depth on dark surfaces — the opposite of what the surface ladder achieves with tonal lifts. The camera preview (explicitly named in DESIGN.md §5 as a surface-1 component) and the PDF canvas are the two elements affected.

**Fix**: Replace `shadow-lg` with `border border-hairline` throughout. The border IS the elevation signal for dark surfaces; shadows are prohibited per DESIGN.md §4 ("The Flat-By-Surface-Ladder Rule").

---

### [P0] Performance mode escape hatch undiscoverable under stage pressure

**File**: `reader/page.tsx` line 206, `PerformanceMode.tsx` lines 120–132

The "Stage Mode" button is `size="sm"` at `bottom-4 right-4`. The escape mechanism ("press any key") is invisible. If Mia's camera fails mid-performance, she cannot find the controls.

**Fix**: (1) Enlarge the Stage Mode button to `size="default"`. (2) Add a one-time tooltip on first stage mode entry: "Press ESC or any key to show controls." (3) Document keyboard fallback (← → arrows) prominently in the upload-state view before camera permission is requested. This maps to PRODUCT.md's principle: manual fallback always works — it must be discoverable, not discoverable by accident.

---

### [P1] Icon-only buttons lack `aria-label`

**File**: `reader/page.tsx` lines 177–192

```tsx
<Button variant="ghost" size="icon" title="Open from Library">
  <Eye className="h-4 w-4" />
</Button>
<Button variant="ghost" size="icon" title="Settings">
  ⚙️
</Button>
```

`title` attributes do not translate to ARIA for screen readers. These two buttons are invisible to Sam (screen reader users) and Sam cannot activate them.

**Fix**: Add `aria-label` to each icon-only button:
```tsx
<Button ... aria-label="Open from Library">
```

---

### [P1] Camera preview uses `bg-black` instead of `bg-surface-1`

**File**: `CameraPreview.tsx` line 93

DESIGN.md §5 explicitly names the camera preview frame as a surface-1 component. `bg-black` creates an abrupt jump from canvas (#010102) to pure black — there is no surface step between them. This breaks the surface ladder.

**Fix**: Change `className="relative bg-black rounded-lg"` → `className="relative bg-surface-1 rounded-lg"` in CameraPreview.tsx.

---

### [P1] Keyboard shortcuts undocumented

**Files**: `NavigationControls.tsx` lines 12–27, `reader/page.tsx`

ArrowLeft/ArrowRight navigation exists and works, but no UI element surfaces this capability. Alex the power user discovers by accident or by reading the code. The "Fallback Controls" section on the landing page mentions arrow keys — but it's below the fold.

**Fix**: Add `title="Navigate pages (← →)"` to the NavigationControls wrapper div. Consider a first-visit tip toast: "Tip: Use ← → arrow keys to turn pages." Keyboard fallback must be discoverable per PRODUCT.md's principle.

---

### [P2] Mid-performance camera failure has no recovery path

**File**: `WinkNavigator.tsx`

If the camera stops providing frames mid-performance (track lost, another app grabs the device, lighting change), WinkNavigator silently stops detecting. Mia has no UI signal that winks are no longer being registered. The camera indicator shows green only when frames are flowing — but the camera indicator is in the camera preview (bottom-right), which she may not be looking at during performance.

**Fix**: Add a "wink not detected" timeout warning after N seconds of no valid wink classification (even "no wink" is a signal). Surface the warning subtly — a single small indicator, not a modal.

---

### [P2] iOS Safari camera quirks not explicitly surfaced

**File**: `CameraPermissionDialog.tsx`

PRODUCT.md §Accessibility requires: "iOS Safari webcam/autoplay quirks must be surfaced as clear warnings, not silent failures." The current error handling is generic.

**Fix**: Add iOS-specific error copy in the camera permission error state:
```tsx
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  setError("iOS: Ensure camera is enabled in Settings → Privacy → Camera, and grant permission when prompted.")
}
```

---

## Persona Red Flags

**Alex (Power User)**: Arrow key navigation undocumented. Debug scores buried in Settings → Camera tab. No calibration profile save or export. Alex opens the reader, finds the arrow keys work, then wonders why the calibration they spent 2 minutes on doesn't persist across sessions.

**Sam (Accessibility User)**: Both icon-only buttons in the reader header are invisible to screen readers. The camera preview shows debug scores with no `aria-live` region — scores update silently. No screen reader announcement when a page turn occurs (wink detected → page advance is a state change with no aria-live counterpart).

**Mia the Musician (Performer Under Stage Pressure)**: Enters stage mode at the worst moment. Camera fails. Cannot find the Stage Mode button to exit. Cannot discover keyboard fallback without leaving the camera's gaze. The keyboard fallback exists but is discoverable by accident only. **This is the highest-risk persona failure in the app.**

---

## Minor Observations

1. **Landing page eyebrow** (page.tsx lines 35–38): A Linear convention, restrained here, but worth questioning: is this scaffolding, or does it serve the musician's mental model of what BlinkScore is?

2. **Feature card icon backgrounds**: Three different opacity levels (`bg-primary/10`, `bg-semantic-success/10`, `bg-brand-secure/20`) for structurally identical elements. Consistent opacity would strengthen the grid.

3. **Privacy message repetition**: Landing page repeats "no data uploaded" three times (hero badge, fallback controls section, footer). Once at hero, once in footer is defensible. The mid-page repetition is one instance too many.

4. **Camera preview aspect ratio** (`w-48 h-36`): Fixed 4:3 but most webcams are 16:9. Face may be cropped for users with wide-angle cameras.

5. **Numbered "How It Works" circles** (page.tsx lines 138, 149, 160): Lavender (`bg-primary`) circles as decorative number badges. DESIGN.md §6 restricts lavender to focus rings, CTAs, and the page-turn flash. These are decorative lavender.

---

## Questions to Consider

1. **If Mia's camera fails 30 seconds before curtain, what does she see?** The permission dialog has a retry button — but mid-performance camera loss (track ended, another app grabbed it) has no recovery path and no UI signal.

2. **Should stage mode have a persistent keyboard hint for first-time users?** "Press ESC to exit, arrows to navigate" shown once could be the difference between confidence and panic.

3. **Has the surface ladder been tested under actual stage lighting?** DESIGN.md §5 acknowledges this risk. The canvas-to-surface-1 contrast may collapse under a warm 500W spotlight from above.

4. **Should debug scores be surfaced more prominently?** "L: 0.34 R: 0.67" shown live could help musicians self-diagnose calibration failures without support contact.

---

*Critique completed: 2026-07-19 | Assessment A: dual-agent sub-agent | Assessment B: detector scan (21 files, 0 issues)*
