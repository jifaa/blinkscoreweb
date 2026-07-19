"use client"

import Link from "next/link"
import { Eye, Shield, Zap, Music, ArrowRight, Camera, Keyboard, Monitor } from "lucide-react"
import { Button } from "~/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Navigation - Linear-style top nav */}
      <nav className="h-14 flex items-center justify-between px-6 border-b border-hairline">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <span className="font-semibold text-ink">BlinkScore</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-ink-subtle">
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-ink transition-colors">How It Works</a>
          <a href="#use-cases" className="hover:text-ink transition-colors">Use Cases</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reader">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Linear dense product-focused style */}
      <section className="flex-1 flex items-center justify-center py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-surface-1 border border-hairline text-ink-subtle text-xs font-medium mb-6">
            <Eye className="w-3.5 h-3.5 text-primary" />
            Hands-free page turning for musicians
          </div>

          {/* Main heading with negative tracking */}
          <h1 className="text-display-lg font-semibold tracking-tight mb-4 text-ink">
            Turn Pages with{" "}
            <span className="text-primary">Your Eyes</span>
          </h1>

          {/* Subheading */}
          <p className="text-subhead text-ink-muted max-w-2xl mx-auto mb-8">
            BlinkScore uses your webcam to detect eye winks and turn sheet music pages
            automatically. 100% private — all processing happens in your browser.
          </p>

          {/* CTA buttons - Linear primary + secondary */}
          <div className="flex items-center justify-center gap-3">
            <Link href="/reader">
              <Button size="lg" className="h-11 px-6">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="h-11 px-6">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Privacy badge */}
          <div className="mt-8 inline-flex items-center gap-2 text-sm text-ink-subtle">
            <Shield className="w-4 h-4 text-semantic-success" />
            <span>No data ever leaves your device. 100% private.</span>
          </div>
        </div>
      </section>

      {/* Features Section - 3-column card grid */}
      <section id="features" className="py-16 px-6 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-headline font-semibold text-ink mb-2">Built for Performers</h2>
            <p className="text-body text-ink-subtle max-w-xl mx-auto">
              Everything you need for distraction-free performances
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Feature 1 - Natural Winks */}
            <div className="bg-surface-1 border border-hairline rounded-lg p-5">
              <div className="w-9 h-9 bg-primary/10 rounded-md flex items-center justify-center mb-4">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-card-title font-medium text-ink mb-1.5">Natural Winks</h3>
              <p className="text-body-sm text-ink-subtle leading-relaxed">
                Right eye wink advances, left eye wink goes back. Normal blinking won&apos;t trigger
                page turns — only intentional winks.
              </p>
            </div>

            {/* Feature 2 - 100% Private */}
            <div className="bg-surface-1 border border-hairline rounded-lg p-5">
              <div className="w-9 h-9 bg-semantic-success/10 rounded-md flex items-center justify-center mb-4">
                <Shield className="w-4 h-4 text-semantic-success" />
              </div>
              <h3 className="text-card-title font-medium text-ink mb-1.5">100% Private</h3>
              <p className="text-body-sm text-ink-subtle leading-relaxed">
                All video processing happens locally in your browser using WebAssembly. No servers,
                no uploads, no subscriptions.
              </p>
            </div>

            {/* Feature 3 - Stage Ready */}
            <div className="bg-surface-1 border border-hairline rounded-lg p-5">
              <div className="w-9 h-9 bg-brand-secure/10 rounded-md flex items-center justify-center mb-4">
                <Zap className="w-4 h-4 text-brand-secure" />
              </div>
              <h3 className="text-card-title font-medium text-ink mb-1.5">Stage Ready</h3>
              <p className="text-body-sm text-ink-subtle leading-relaxed">
                Fullscreen performance mode with auto-hiding controls. Screen stays awake during
                your performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-6 border-t border-hairline">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-headline font-semibold text-ink mb-2">How It Works</h2>
            <p className="text-body text-ink-subtle max-w-xl mx-auto">
              Get started in under a minute
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-5 text-ink font-semibold text-lg">
                1
              </div>
              <h3 className="text-card-title font-medium text-ink mb-2">Upload Your Score</h3>
              <p className="text-body text-ink-subtle">
                Drag and drop your PDF sheet music directly into the browser.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-5 text-ink font-semibold text-lg">
                2
              </div>
              <h3 className="text-card-title font-medium text-ink mb-2">Calibrate Once</h3>
              <p className="text-body text-ink-subtle">
                Follow the quick calibration wizard to set your personal wink thresholds.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-5 text-ink font-semibold text-lg">
                3
              </div>
              <h3 className="text-card-title font-medium text-ink mb-2">Perform</h3>
              <p className="text-body text-ink-subtle">
                Enable camera, enter stage mode, and turn pages with a natural eye wink.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-16 px-6 border-t border-hairline">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-headline font-semibold text-ink mb-2">Perfect For</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Use Case 1 */}
            <div className="flex items-start gap-4 p-5 bg-surface-1 border border-hairline rounded-lg">
              <Music className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-body font-medium text-ink mb-1">Pianists & Organists</h3>
                <p className="text-body-sm text-ink-subtle">
                  Both hands on the keys, eyes on the music. No page turner needed.
                </p>
              </div>
            </div>

            {/* Use Case 2 */}
            <div className="flex items-start gap-4 p-5 bg-surface-1 border border-hairline rounded-lg">
              <Camera className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-body font-medium text-ink mb-1">Multi-tasking Musicians</h3>
                <p className="text-body-sm text-ink-subtle">
                  Sing, conduct, or play while keeping full control of your score.
                </p>
              </div>
            </div>

            {/* Use Case 3 */}
            <div className="flex items-start gap-4 p-5 bg-surface-1 border border-hairline rounded-lg">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-body font-medium text-ink mb-1">Privacy-Conscious</h3>
                <p className="text-body-sm text-ink-subtle">
                  On-stage or in the studio. No cloud processing, no data collection.
                </p>
              </div>
            </div>

            {/* Use Case 4 */}
            <div className="flex items-start gap-4 p-5 bg-surface-1 border border-hairline rounded-lg">
              <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-body font-medium text-ink mb-1">Live Performers</h3>
                <p className="text-body-sm text-ink-subtle">
                  Stage mode keeps your display focused and prevents screen timeout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fallback Controls Section - Important for accessibility */}
      <section className="py-12 px-6 border-t border-hairline bg-surface-1">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-headline font-semibold text-ink mb-2">Always Have Control</h2>
          <p className="text-body text-ink-subtle max-w-xl mx-auto mb-6">
            In addition to wink detection, BlinkScore includes keyboard shortcuts and manual buttons
            for complete reliability.
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <Keyboard className="w-5 h-5 text-ink-subtle" />
              <span className="text-sm text-ink-subtle">Arrow Keys</span>
            </div>
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-ink-subtle" />
              <span className="text-sm text-ink-subtle">Edge Click</span>
            </div>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <span className="text-sm text-ink-subtle">Eye Winks</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Linear cta-banner style */}
      <section className="py-12 px-6 border-t border-hairline">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-headline font-semibold text-ink mb-3">
            Ready to Turn Pages Hands-Free?
          </h2>
          <p className="text-body text-ink-subtle mb-6 max-w-xl mx-auto">
            Join musicians who perform with confidence, knowing their page turns are reliable and
            completely private.
          </p>
          <Link href="/reader">
            <Button size="lg" className="h-11 px-8">
              Try BlinkScore Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer - Linear footer style */}
      <footer className="border-t border-hairline py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-ink">BlinkScore</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-ink-subtle">
            <Shield className="w-3.5 h-3.5 text-semantic-success" />
            <span>100% client-side processing. Your data never leaves your device.</span>
          </div>

          <div className="flex gap-6 text-sm text-ink-subtle">
            <a href="#" className="hover:text-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
