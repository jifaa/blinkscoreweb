# Product

## Register

product

## Platform

web

## Users

**Live performers** — musicians reading sheet music during a live performance. Their hands are occupied (instrument, baton, conducting), their eyes must stay on the score. Context: stage lighting, audience pressure, no room to look away. Secondary: practice-session musicians who want hands-free convenience; accessibility users with limited hand mobility.

## Product Purpose

BlinkScore turns PDF sheet music pages using eye winks — right eye wink advances, left eye wink goes back. All face detection runs entirely client-side in the browser; no video, frame, or landmark data ever leaves the device. The product exists so a performer never has to break eye contact with the score to turn a page.

## Positioning

**The only hands-free sheet music reader that never touches your video.** Every other solution either requires hand gestures, special hardware, or uploads frames to a server. BlinkScore is the performer-friendly, privacy-respecting alternative.

## Brand Personality

Focused and professional. A precision tool for serious musicians. Clean, minimal, and fast — like Linear or Raycast. The UI disappears during performance; the only thing that matters is the score and the camera.

## Anti-references

- Not a SaaS dashboard or generic admin UI — this is a performer tool
- Not a "smart home" app with pastel gradients or rounded-everything softness
- Not a research demo with debug overlays and raw landmark points always visible
- Not a landing page built to impress investors — the landing page exists to get the musician to /reader, and /reader exists to serve the score

## Design Principles

**The score is the product.** Every pixel of UI chrome exists to serve the PDF, not to demonstrate design skill. When the performer is playing, the UI should be nearly invisible.

**Privacy is load-bearing, not a feature.** The client-side-only architecture is not a selling point to market — it is a precondition for performer trust. The privacy messaging should appear once, clearly, and never again.

**Performance is non-negotiable.** The camera loop runs at ~15fps inference on a laptop battery during a 90-minute concert. Every render, every animation, every state update in /reader is measured against this constraint.

**Manual fallback always works.** A right-eye wink should never be the only way to turn a page. Keyboard, touch, and on-screen buttons are primary features, not fallbacks.

**The wink classifier is the hardest problem in the app.** It must not misfire on ordinary blinks. Calibration must be fast and robust across lighting conditions and camera angles.

## Accessibility & Inclusion

- Full keyboard navigation and ARIA labels on all controls — the fallback is a first-class interaction mode, not an afterthought
- Camera-dependent behavior (wink navigation) degrades gracefully: buttons and keyboard always work
- iOS Safari webcam/autoplay quirks must be surfaced as clear warnings, not silent failures
- Reduced motion respected throughout — no animation is load-bearing
