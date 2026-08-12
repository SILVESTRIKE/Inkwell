# Design Tokens — Neo-Editorial / Dark Academia Aesthetic

Companion to `docs/architecture.md`. Single source of truth for Inkwell's visual system, typography, colors, and layout mechanics.

Direction: **Neo-Editorial Layout** — old book + writer's desk + contemporary publishing house. The UI is a quiet, cinematic container that lets the book content take center stage.

---

## 1. Color System

### Dark Theme — "Nocturnal Editorial / Dark Academia" (DEFAULT)
```css
--color-bg: #141311;           /* Obsidian — dark page background */
--color-bg-raised: #1D1B18;    /* Charcoal — cards, header, surface panels */
--color-text: #E8E0D2;         /* Paper — primary text (never #FFFFFF) */
--color-text-muted: #A9A095;   /* Muted Paper — secondary text & captions */
--color-text-faint: #5C554E;   /* Faint — disabled / quiet metadata */
--color-accent: #B65335;        /* Oxide / Rust — singular primary accent */
--color-accent-hover: #C96041;  /* Slightly lighter Oxide for hover */
--color-accent-soft: rgba(182, 83, 53, 0.12); /* Oxide tint for highlights */
--color-border: #38332D;        /* Dark border — thin 1px rules */
--color-border-strong: #4D4740; /* Hairline borders on hover / active */
--color-success: #6E9B7B;      /* Muted Forest Green */
--color-error: #B65335;        /* Oxide Rust */
--color-error-bg: rgba(182, 83, 53, 0.12);
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4);
--shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.5);
```

### Light Theme — "Literary / Analog Editorial"
```css
--color-bg: #F5F0E7;           /* Paper — light page background */
--color-bg-raised: #EDE6D8;    /* Paper 2 — raised surfaces */
--color-text: #29231F;         /* Ink — warm ink black (never #000000) */
--color-text-muted: #756B62;   /* Muted Ink — secondary text */
--color-text-faint: #A69B90;   /* Faint — quiet metadata */
--color-accent: #A94E2D;        /* Rust — primary accent */
--color-accent-hover: #903E20;  /* Deeper Rust */
--color-accent-soft: rgba(169, 78, 45, 0.10);
--color-border: #D8CFC0;        /* Line — subtle paper rules */
--color-border-strong: #C5BBAA;
--color-success: #3F6B4F;
--color-error: #A94E2D;
--color-error-bg: #F3E8E3;
--shadow-card: 0 1px 3px rgba(41, 35, 31, 0.05);
--shadow-card-hover: 0 4px 14px rgba(41, 35, 31, 0.08);
```

---

## 2. Typography

| Role | Font Family | Weights | Usage |
|---|---|---|---|
| **Display Headings** | `Playfair Display`, serif | 700, 800 | Section titles, brand logo, step act titles |
| **Book Body Text** | `Source Serif 4`, serif | 400, 500, 600, 400i | Full book text, character & chapter descriptions |
| **UI Chrome & Labels** | `Inter` / `Geist`, sans-serif | 400, 500, 600 | Small uppercase labels (`text-[11px] uppercase tracking-[0.14em]`), buttons, navigation |

---

## 3. Shape & Radii System

- **Cards & Panels**: `4px` (`--radius-md`) — sharp, paper-like edges.
- **Inputs & Buttons**: `3px` (`--radius-sm`) — minimal, clean.
- **Step Indicators**: `2px` (`--radius-xs`).
- **No Pill Buttons**: Absolutely no `rounded-full` buttons or status capsules.

---

## 4. Motion & Micro-Interactions

- **Duration**: `150ms` (`--duration-fast`), `200ms` (`--duration-base`).
- **Easing**: `cubic-bezier(0.25, 0.1, 0.25, 1)` — quiet, non-bouncy transition.
- **Reduced Motion**: Automatically degrades to static display when `prefers-reduced-motion: reduce` is detected.

---

## 5. Five-Act Narrative Stepper

Instead of traditional numbered circles:
1. `01 — STYLE`: Define the visual language
2. `02 — CHARACTERS`: Discover who lives inside the story
3. `03 — PORTRAITS`: Give them a face
4. `04 — CHAPTERS`: Understand the world
5. `05 — ILLUSTRATIONS`: Bring the story to life
