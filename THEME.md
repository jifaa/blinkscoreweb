# BlinkScore Design System - THEME.md

This document maps `DESIGN.md` tokens to the actual CSS variables and Tailwind classes used in the codebase.

## Color Token Mapping

| DESIGN.md Token | CSS Variable | Tailwind Class | Usage |
|-----------------|-------------|----------------|-------|
| `{colors.primary}` | `--color-primary` | `text-primary`, `bg-primary` | Primary CTA, focus rings, wink flash |
| `{colors.primary-hover}` | `--color-primary-hover` | `hover:bg-primary-hover` | Button hover state |
| `{colors.primary-focus}` | `--color-primary-focus` | `focus-visible:ring-primary-focus` | Focus ring color |
| `{colors.on-primary}` | `--color-on-primary` | `text-primary-foreground` | Text on primary buttons |
| `{colors.canvas}` | `--color-canvas` | `bg-canvas` | Page background |
| `{colors.surface-1}` | `--color-surface-1` | `bg-surface-1` | Cards, panels |
| `{colors.surface-2}` | `--color-surface-2` | `bg-surface-2` | Featured elements, selected states |
| `{colors.surface-3}` | `--color-surface-3` | `bg-surface-3` | Dropdowns, menus |
| `{colors.hairline}` | `--color-hairline` | `border-hairline` | Card borders |
| `{colors.hairline-strong}` | `--color-border` | `border-hairline-strong` | Input borders, stronger borders |
| `{colors.ink}` | `--color-ink` | `text-ink`, `bg-ink` | Primary text color |
| `{colors.ink-muted}` | `--color-ink-muted` | `text-ink-muted` | Secondary text |
| `{colors.ink-subtle}` | `--color-ink-subtle` | `text-ink-subtle` | Tertiary text, placeholders |
| `{colors.ink-tertiary}` | `--color-ink-tertiary` | `text-ink-tertiary` | Disabled text |
| `{colors.semantic-success}` | `--color-semantic-success` | `text-semantic-success` | Success indicators |
| `{colors.brand-secure}` | `--color-brand-secure` | `text-brand-secure` | Secure/privacy badges |

## Typography Token Mapping

| DESIGN.md Token | CSS Variable | Tailwind Class | Usage |
|-----------------|-------------|----------------|-------|
| `{typography.display-xl}` | `--text-display-xl` | `text-display-xl` | Hero headline (80px) |
| `{typography.display-lg}` | `--text-display-lg` | `text-display-lg` | Section headers (56px) |
| `{typography.display-md}` | `--text-display-md` | `text-display-md` | Sub-headers (40px) |
| `{typography.headline}` | (implicit in h2) | `text-headline` | Page sections (28px) |
| `{typography.card-title}` | `--text-card-title` | `text-card-title` | Card titles (22px) |
| `{typography.body-lg}` | `--text-body-lg` | `text-body-lg` | Lead paragraphs (18px) |
| `{typography.body}` | `--text-body` | `text-body` | Default body (16px) |
| `{typography.body-sm}` | `--text-body-sm` | `text-body-sm` | Secondary text (14px) |
| `{typography.button}` | `--text-button` | (in button styles) | Button labels |
| `{typography.eyebrow}` | `--text-eyebrow` | `text-eyebrow` | Section labels |
| `{typography.mono}` | `--text-mono` | `text-mono` | Technical/debug text |

## Spacing Token Mapping

| DESIGN.md Token | CSS Variable | Tailwind Class | Usage |
|-----------------|-------------|----------------|-------|
| `{spacing.xxs}` | `--space-xxs` | `gap-1` | 4px |
| `{spacing.xs}` | `--space-xs` | `gap-2` | 8px |
| `{spacing.sm}` | `--space-sm` | `gap-3` | 12px |
| `{spacing.md}` | `--space-md` | `gap-4` | 16px |
| `{spacing.lg}` | `--space-lg` | `gap-6` | 24px |
| `{spacing.xl}` | `--space-xl` | `gap-8` | 32px |
| `{spacing.xxl}` | `--space-xxl` | `gap-12` | 48px |

## Radius Token Mapping

| DESIGN.md Token | CSS Variable | Tailwind Class | Usage |
|-----------------|-------------|----------------|-------|
| `{rounded.xs}` | `--radius-xs` | `rounded-xs` | 4px |
| `{rounded.sm}` | `--radius-sm` | `rounded-sm` | 6px |
| `{rounded.md}` | `--radius-md` | `rounded-md` | 8px (buttons) |
| `{rounded.lg}` | `--radius-lg` | `rounded-lg` | 12px (cards) |
| `{rounded.xl}` | `--radius-xl` | `rounded-xl` | 16px (panels) |
| `{rounded.pill}` | `--radius-pill` | `rounded-pill` | Toggle pills |

## Button Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| `default` | `bg-primary` | `text-primary-foreground` | none | Primary CTA |
| `secondary` | `bg-surface-1` | `text-ink` | `border-hairline` | Secondary actions |
| `ghost` | transparent | `text-ink` | none | Subtle actions |
| `destructive` | `bg-destructive` | `text-white` | none | Delete actions |
| `link` | transparent | `text-primary` | underline | Text links |
| `inverse` | `bg-white` | `text-black` | none | High contrast CTA |

## Elevation System

| Level | Treatment | Usage |
|-------|-----------|-------|
| 0 | No styling | Default body text |
| 1 | `bg-surface-1 border border-hairline` | Cards, panels |
| 2 | `bg-surface-2 border border-hairline-strong` | Featured elements |
| 3 | `bg-surface-3` | Dropdowns, menus |

## Accent Color Usage Rules

Per DESIGN.md, the lavender-blue primary accent (`#5e6ad2`) should ONLY appear in:
1. **Primary CTA buttons** - Get Started, Try Free
2. **Focus rings** - `focus-visible:ring-primary-focus`
3. **Wink detection flash** - Visual confirmation when page turns

**Must NOT appear in:**
- Backgrounds or decorative surfaces
- Icons (unless they're CTAs)
- Secondary buttons
- Section dividers

## Dark Mode Only

This design system is **dark-only**. The reader and all screens use:
- `bg-canvas` (#010102) as the base
- `text-ink` (#f7f8f8) for primary text
- `text-ink-subtle` (#8a8f98) for secondary text

This is intentional per the "stage/dim lighting" use case and DESIGN.md's "Don't ship a light-mode marketing page" rule.

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Desktop | 1280px+ | 3-column card grid |
| Tablet | 1024px | 2-column card grid |
| Mobile | 768px | 1-column layout |
