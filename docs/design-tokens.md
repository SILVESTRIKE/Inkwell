# Design Tokens — Literary / Analog Aesthetic

Companion to `docs/architecture.md`. This is the single source of truth for color, type, and
spacing — components should reference these tokens (as CSS variables or Tailwind config), not
hardcode hex values inline. If a value needs to change, it changes here once.

Direction: a well-made physical book, not a SaaS dashboard. Paper and ink, not glass and
gradients. Light theme reads as "the page," dark theme reads as "reading by lamplight" — not an
inverted terminal.

## 1. Color — Light theme ("the page")

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#F7F3EC` | Page background — warm off-white, not pure white |
| `--color-bg-raised` | `#FBF8F2` | Cards, modals — barely lighter than page, not a jump |
| `--color-text` | `#211D19` | Primary body/heading text — warm near-black ink |
| `--color-text-muted` | `#8A7F72` | Metadata, timestamps, captions, placeholder text |
| `--color-text-faint` | `#B3A99A` | Disabled text, least important labels |
| `--color-accent` | `#2E3A59` | Primary ink accent — links, active step, primary button |
| `--color-accent-hover` | `#242D46` | Accent hover/pressed state |
| `--color-accent-soft` | `#E4E7EE` | Accent-tinted backgrounds (selected row, active tab) |
| `--color-border` | `rgba(33,29,25,0.10)` | Hairline dividers, card borders |
| `--color-border-strong` | `rgba(33,29,25,0.18)` | Input borders, emphasized rules |
| `--color-success` | `#3F6B4F` | Step done, success states — muted forest, not bright green |
| `--color-error` | `#8C3A2B` | Step failed, error states — oxblood/rust, not fire-engine red |
| `--color-error-bg` | `#F5E7E3` | Error banner background |
| `--color-warning` | `#8A6D2F` | Stuck-step / recovery affordance — muted amber-brown |
| `--color-warning-bg` | `#F3ECDD` | Warning banner background |

## 2. Color — Dark theme ("reading by lamplight")

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#1C1815` | Page background — warm near-black, not blue-black |
| `--color-bg-raised` | `#221D19` | Cards, modals |
| `--color-text` | `#EDE6D9` | Primary text — warm parchment, never pure white |
| `--color-text-muted` | `#A69A88` | Metadata, timestamps, captions |
| `--color-text-faint` | `#6E6355` | Disabled text |
| `--color-accent` | `#C99B4A` | Primary accent — muted gold/amber, evokes gold-leaf, never neon |
| `--color-accent-hover` | `#DAAE5F` | Accent hover/pressed |
| `--color-accent-soft` | `rgba(201,155,74,0.14)` | Accent-tinted backgrounds |
| `--color-border` | `rgba(237,230,217,0.08)` | Hairline dividers, card borders |
| `--color-border-strong` | `rgba(237,230,217,0.16)` | Input borders |
| `--color-success` | `#7FA98D` | Step done — desaturated sage |
| `--color-error` | `#C97B65` | Step failed — dusty terracotta, not neon red |
| `--color-error-bg` | `rgba(201,123,101,0.12)` | Error banner background |
| `--color-warning` | `#C9A85C` | Stuck-step / recovery affordance |
| `--color-warning-bg` | `rgba(201,168,92,0.12)` | Warning banner background |

**Never**: pure white text on pure black, saturated neon accents, colored drop shadows or glow
effects — all read as "developer dark mode," not "lamplight."

## 3. Typography

| Token | Value | Usage |
|---|---|---|
| `--font-serif` | `"Fraunces", Georgia, serif` | Headings, project titles, chapter/character names |
| `--font-body` | `"Source Serif 4", Georgia, serif` | Body copy, book text display, card descriptions |
| `--font-ui` | `"Inter", -apple-system, sans-serif` | Buttons, labels, form inputs, nav, timestamps |

Fraunces variable font: set `font-optical-sizing: auto` and lean into its ink-trap detailing at
large sizes (headings ≥ 28px) — at small sizes dial `font-variation-settings: "SOFT" 0, "WONK" 0`
so it doesn't get twee in UI chrome.

### Type scale (major third, 1.25 ratio, 16px base)

| Token | Size | Line-height | Weight | Font | Usage |
|---|---|---|---|---|---|
| `--text-xs` | 12px | 1.4 | 400 | ui | Timestamps, meta labels |
| `--text-sm` | 14px | 1.5 | 400 | ui | Secondary UI text, captions |
| `--text-base` | 16px | 1.65 | 400 | body | Body copy, card descriptions |
| `--text-lg` | 18px | 1.6 | 400 | body | Book text display (readable-at-length copy) |
| `--text-xl` | 20px | 1.4 | 600 | serif | Card titles (character/chapter names) |
| `--text-2xl` | 25px | 1.3 | 600 | serif | Section headings, project title on detail page |
| `--text-3xl` | 31px | 1.25 | 600 | serif | Page-level heading (rare — one per page) |
| `--text-4xl` | 39px | 1.2 | 600 | serif | Marketing/landing only, if any |

Body measure: cap book-text display and long-form copy at `max-width: 68ch` — book typesetting,
not app density. Never justify text; ragged-right only.

## 4. Spacing scale (4px base unit)

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |

Card internal padding: `--space-5` to `--space-6`. Section gaps on the project detail page:
`--space-8` to `--space-10`. Don't go below `--space-4` between distinct interactive elements —
this aesthetic reads as generous, not cramped.

## 5. Radius, border, shadow

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 3px | Inputs, small buttons, tags |
| `--radius-md` | 6px | Cards, modals |
| `--radius-lg` | 10px | Rare — large image frames only |
| `--border-width` | 1px | All borders — hairline, never thick |
| `--shadow-card` | `0 1px 2px rgba(33,29,25,0.06)` (light) / `0 1px 2px rgba(0,0,0,0.3)` (dark) | Resting card |
| `--shadow-card-hover` | `0 4px 10px rgba(33,29,25,0.08)` (light) / `0 4px 12px rgba(0,0,0,0.4)` (dark) | Card hover — "lifting off the stack" |

**Never** use pill-shaped buttons (`border-radius: 999px`) or glassmorphism (`backdrop-filter:
blur`) — both break the printed-page metaphor. Keep radii small and consistent.

## 6. Motion

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 120ms | Hover states, focus rings |
| `--duration-base` | 180ms | Card hover lift, tab switches |
| `--duration-slow` | 240ms | Page-level transitions, modal open/close |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default easing — quick out, no bounce |

No spring/bounce easing anywhere — reads as playful-app, not literary. Keep all motion under
250ms; this is a reference tool, not an entertainment surface.

## 7. Breakpoints

| Token | Value |
|---|---|
| `--bp-sm` | 640px |
| `--bp-md` | 768px |
| `--bp-lg` | 1024px |
| `--bp-xl` | 1280px |

Project detail page: single column below `--bp-md`, book-text panel + pipeline panel side by
side above `--bp-lg`.

## 8. CSS custom properties (drop into `globals.css`)

```css
:root {
  /* color — light (default) */
  --color-bg: #F7F3EC;
  --color-bg-raised: #FBF8F2;
  --color-text: #211D19;
  --color-text-muted: #8A7F72;
  --color-text-faint: #B3A99A;
  --color-accent: #2E3A59;
  --color-accent-hover: #242D46;
  --color-accent-soft: #E4E7EE;
  --color-border: rgba(33,29,25,0.10);
  --color-border-strong: rgba(33,29,25,0.18);
  --color-success: #3F6B4F;
  --color-error: #8C3A2B;
  --color-error-bg: #F5E7E3;
  --color-warning: #8A6D2F;
  --color-warning-bg: #F3ECDD;

  /* type */
  --font-serif: "Fraunces", Georgia, serif;
  --font-body: "Source Serif 4", Georgia, serif;
  --font-ui: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5625rem;
  --text-3xl: 1.953rem;
  --text-4xl: 2.441rem;

  /* spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;

  /* radius / border / shadow */
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --border-width: 1px;
  --shadow-card: 0 1px 2px rgba(33,29,25,0.06);
  --shadow-card-hover: 0 4px 10px rgba(33,29,25,0.08);

  /* motion */
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 240ms;
  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
}

[data-theme="dark"] {
  --color-bg: #1C1815;
  --color-bg-raised: #221D19;
  --color-text: #EDE6D9;
  --color-text-muted: #A69A88;
  --color-text-faint: #6E6355;
  --color-accent: #C99B4A;
  --color-accent-hover: #DAAE5F;
  --color-accent-soft: rgba(201,155,74,0.14);
  --color-border: rgba(237,230,217,0.08);
  --color-border-strong: rgba(237,230,217,0.16);
  --color-success: #7FA98D;
  --color-error: #C97B65;
  --color-error-bg: rgba(201,123,101,0.12);
  --color-warning: #C9A85C;
  --color-warning-bg: rgba(201,168,92,0.12);
  --shadow-card: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.4);
}
```

## 9. Tailwind config extension

```js
// tailwind.config.js
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-raised': 'var(--color-bg-raised)',
        ink: 'var(--color-text)',
        'ink-muted': 'var(--color-text-muted)',
        'ink-faint': 'var(--color-text-faint)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-soft': 'var(--color-accent-soft)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        'error-bg': 'var(--color-error-bg)',
        warning: 'var(--color-warning)',
        'warning-bg': 'var(--color-warning-bg)',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '3px',
        md: '6px',
        lg: '10px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '240ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
};
```
