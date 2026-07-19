---
name: BlinkScore
description: Hands-free sheet music page turning using eye wink detection — a performer's precision tool on a deep-dark canvas.
colors:
  primary: "#5e6ad2"
  primary-hover: "#828fff"
  primary-focus: "#5e69d1"
  on-primary: "#ffffff"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  surface-4: "#191a1b"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  hairline-tertiary: "#3e3e44"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  semantic-success: "#27a644"
  brand-secure: "#7a7fad"
  destructive: "#ef4444"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  dialog:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  switch:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  progress:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
---

# Design System: BlinkScore

## 1. Overview

**Creative North Star: "The Stage Dark"**

The stage is dark so the performer can see the score. BlinkScore's interface is dark for the same reason — every pixel of chrome exists to serve the PDF, not to demonstrate design craft. The near-black canvas (#010102) is the darkness; charcoal surface lifts on cards, panels, and controls create hierarchy without ever competing with the sheet music. A single lavender-blue accent (#5e6ad2) marks the elements that matter: focus rings, primary CTAs, the active page indicator. Nothing else is this color.

The personality is focused and professional — a precision instrument, not a consumer app. Inter at 14–16px with measured negative tracking carries the type; JetBrains Mono marks debug values, camera device IDs, and technical metadata. The system reads as software-built-for-experts: dense information where density serves the performer (debug scores, camera status, page counters), and near-silence everywhere else.

**Key Characteristics:**
- Deepest-dark canvas (#010102) anchors every screen — the darkness is load-bearing
- Single lavender-blue accent (#5e6ad2) used exclusively on focus rings, primary CTAs, and the active page indicator
- Four-step surface ladder (surface-1 through surface-4) carries all hierarchy — no shadows on dark surfaces
- Inter + JetBrains Mono; display type holds negative tracking (-0.03em at 5rem)
- Cards use 12px corners with 1px hairline borders (#23252a) — never pill, never decorative

## 2. Colors

**The Midnight Rule.** The canvas is not black for aesthetic reasons — it is #010102 so stage lighting doesn't wash out the UI. Every surface lift exists to group related controls. The lavender accent is scarce by doctrine: focus rings, primary CTAs, the single "page turn flash" that confirms a detected wink.

### Primary / Accent
- **Lavender-Blue** (#5e6ad2): Primary CTA buttons, focus rings (`:focus-visible`), the active thumbnail border, the accent page indicator.
- **Lavender Light** (#828fff): Hover state of primary buttons. Never used decoratively.
- **Lavender Focus** (#5e69d1): Focus ring tint — `:focus-visible` outline.
- **Brand Secure** (#7a7fad): Secondary lavender for technical surfaces (device labels, version metadata).

### Surface
- **Canvas** (#010102): Default page background. Near-pure black with a faint blue tint — not #000000, not a warm near-black.
- **Surface 1** (#0f1011): Card backgrounds, dialog backgrounds, the camera preview frame, input fields. One step above canvas.
- **Surface 2** (#141516): Secondary buttons, the page-counter pill, the progress bar track. Two steps above canvas.
- **Surface 3** (#18191a): Muted text backgrounds, dropdown surfaces. Three steps above canvas.
- **Surface 4** (#191a1b): Deepest lifted surface, rarely used.

### Hairlines
- **Hairline** (#23252a): 1px borders on cards, dividers, the camera frame.
- **Hairline Strong** (#34343a): Stronger borders — input focus rings, the active thumbnail border.
- **Hairline Tertiary** (#3e3e44): Subtle nested dividers.

### Text
- **Ink** (#f7f8f8): All headlines, emphasized body type, button labels.
- **Ink Muted** (#d0d6e0): Secondary type — the page counter, camera status indicator.
- **Ink Subtle** (#8a8f98): Placeholder text, tertiary labels, the "page X of Y" total count.
- **Ink Tertiary** (#62666d): Disabled states, footnote metadata.

### Semantic
- **Success Green** (#27a644): Camera-active indicator dot (always pulsing green).
- **Destructive Red** (#ef4444): Delete buttons, error states in forms.

**The Lavender Scarcity Rule.** The accent never appears as a section background, a decorative glow, or a decorative border. It appears on ≤3 elements at a time: the focused button, the active page thumbnail border, and the page-turn flash. If a designer wants to add a fourth lavender element, the right answer is no.

## 3. Typography

**Display Font:** Inter (variable weight, with `system-ui` fallback)
**Body Font:** Inter
**Label/Mono Font:** JetBrains Mono

**Character:** Clean, technical, and unapologetic. Inter carries all display and body text without drama — the precision comes from the tight negative tracking at large sizes and the clean legibility of 16px body at 1.5 line-height. JetBrains Mono is reserved for debug scores (the raw `0.34` and `0.67` values shown in camera overlay), device IDs, and technical metadata — never for prose.

### Hierarchy
- **Display** (600, clamp 2.5–5rem, -0.03em): Hero headline on the landing page only. Never in /reader.
- **Headline** (600, 28px, -0.01em): Section titles, dialog headers, the sheet music filename.
- **Body** (400, 16px, 0): Default body text, UI labels, toast messages.
- **Caption** (400, 12px, 0): Camera status, page counts, debug overlay values.
- **Mono** (400, 13px, 0): Raw numerical values (blink scores, device IDs).

**The No-Decoration Rule.** Display type in /reader is forbidden. The reader UI uses headline weight at most — the PDF is the display content. The landing page display type is the single exception.

## 4. Elevation

**The Flat-By-Surface-Ladder Rule.** BlinkScore uses zero drop shadows. All depth is conveyed by the surface ladder: each surface step (#0f1011 → #141516 → #18191a) creates a tonal lift against the canvas. Borders do the structural work that shadows do in lighter UIs. Cards and dialogs are surface-1 on canvas with a 1px hairline border — that's the elevation. Hovered cards lift to surface-2. Focused inputs get a 2px lavender outline at reduced opacity.

### Shadow Vocabulary
No shadows. Do not add them.

### The Stage-Ready Rule. Every surface and border must remain legible under stage lighting (which is often warm, bright, and angled). The canvas-to-surface contrast must not collapse when lit from above. If a panel looks good in a dark office but disappears under a stage spot, the contrast is insufficient.

## 5. Components

### Buttons
- **Primary:** Lavender background (#5e6ad2), white text, 8px radius, 8px 14px padding. Hover: lighter lavender (#828fff). Pressed: subtle darken.
- **Secondary:** Surface-1 background (#0f1011), ink text (#f7f8f8), 1px hairline border, same radius/padding. Used for "Back", "Cancel", "Reset to Defaults".
- **Ghost:** Transparent background, ink text, same radius/padding. Used for icon-only controls (settings gear, navigation arrows).
- **Focus:** 2px lavender outline, 2px offset — never none. Accessibility is non-negotiable.

### Cards / Containers
- **Camera Preview Frame:** Surface-1 background, 1px hairline border, 8px radius. The live video fills it — the frame is just a boundary.
- **Settings Sheet:** Surface-1, 8px radius on mobile (400px wide on desktop). Tabs for Camera / Wink / Feedback.
- **Dialog:** Surface-1, 8px radius, 24px padding. Used for Calibration Wizard, Library, Delete Confirmation.
- **Toast:** Sonner default with dark surface override — short-lived navigation feedback.

### Inputs / Fields
- **Text inputs:** Surface-1 background, hairline border, 8px radius, 8px 12px padding. Focus: 2px lavender outline.
- **Select:** Native `<select>` styled with surface-1 + hairline + 8px radius. Works correctly on all platforms.
- **Sliders:** Surface-2 track, lavender thumb. Used for thresholds, duration, and cooldown settings.
- **Switches:** Surface-2 off, lavender on. Pill-shaped (9999px radius).

### Navigation
- **Header (Reader):** 56px height, canvas background, hairline bottom border. Logo left, NavigationControls center, Settings + Library icons right.
- **NavigationControls:** ChevronLeft / ChevronRight icon buttons flanking a `currentPage / totalPages` pill. Fit-mode segmented control (Auto / Width / Height) in a bordered sub-group.

### Camera Overlay
- **Debug Scores:** Black 70% overlay, white monospace text, positioned bottom-left of camera frame. Shows `L: 0.34 R: 0.67` in green or red per threshold.
- **Camera Indicator:** Top-right of camera frame — pulsing green dot + Camera icon. Shows camera is live.

### Signature Component: The Page Turn Flash
The single most important visual feedback in the app. When a wink triggers a page turn, a brief lavender flash (#5e6ad2 at 40% opacity) fills the camera frame for ~200ms. This is the performer's confirmation that the camera registered the wink — not a toast, not a sound, a flash in the camera frame they're already looking at. This component has no other uses.

## 6. Do's and Don'ts

### Do:
- **Do** use the canvas (#010102) as the stage — the darkness is load-bearing, not decorative.
- **Do** reserve lavender (#5e6ad2) exclusively for: focus rings, primary CTAs, active page thumbnail border, the page-turn flash.
- **Do** build all depth from the surface ladder. Surface-1 → Surface-2 → Surface-3. No shadows.
- **Do** use hairline borders (1px, #23252a) to define card and panel edges.
- **Do** keep /reader minimal. The score is the protagonist. Every other element is a supporting actor.
- **Do** show camera status (green pulsing dot) when the camera is active.
- **Do** surface iOS Safari camera failures as explicit warnings — not silent degradation.
- **Do** keep debug scores (monospace blink values) available but off by default.

### Don't:
- **Don't** add drop shadows to dark surfaces — they look muddy and fight the surface ladder.
- **Don't** use lavender as a section background, a decorative border, or a gradient endpoint.
- **Don't** use any second chromatic accent (orange, green, red for UI chrome). Destructive red (#ef4444) is reserved for delete actions only.
- **Don't** use warm near-black (#121212, #1a1a1a) as the canvas — stage lighting washes those out.
- **Don't** put display-size typography in /reader. The PDF IS the display.
- **Don't** animate layout properties (width, height, margin) in the reader view — it disrupts the performer's eye anchor.
- **Don't** ship camera-dependent navigation without fully functional keyboard and button fallbacks.
- **Don't** add atmospheric gradients, spotlight cards, or decorative glows. The stage is already dark.
- **Don't** use rounded-full (pill) corners on cards or dialogs — 12px (lg) maximum.
- **Don't** surface debug overlays or raw landmark points to the performer. These are developer tools.
