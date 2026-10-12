---
name: Central de Relatórios
description: A calm, warm consumer-app surface for sending and fetching fiscal documents, where only what you can press is saturated.
colors:
  action: "#CC4520"
  action-hover: "#B33C1B"
  action-soft: "#FBE5DB"
  ground: "#F6F1EA"
  card: "#FFFFFF"
  tile: "#EFE7DC"
  line: "#E4DACD"
  ink: "#2A2622"
  ink-soft: "#6B6158"
  ok: "#2F7D4F"
  ok-soft: "#E3F0E7"
  warn: "#8A5A00"
  warn-dot: "#D69A00"
  warn-soft: "#FBEFD5"
  danger: "#B42318"
  danger-soft: "#FBE4E1"
typography:
  display:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.4
  title:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.43
    fontFeature: "tnum"
  label:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.33
  tile-label:
    fontFamily: "Nunito Sans, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    letterSpacing: "0.025em"
rounded:
  pill: "9999px"
  card: "24px"
  sheet: "28px"
  tile: "16px"
  tooltip: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  card: "20px"
  lg: "24px"
  dialog: "28px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.tile}"
    textColor: "{colors.ink-soft}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "40px"
  button-download:
    backgroundColor: "{colors.action}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  button-download-unavailable:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  chip-filter:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  chip-filter-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
  input-search:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 48px 0 44px"
    height: "48px"
  report-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  file-type-tile:
    backgroundColor: "{colors.tile}"
    textColor: "{colors.ink}"
    typography: "{typography.tile-label}"
    rounded: "{rounded.tile}"
    size: "48px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.tooltip}"
    padding: "8px 12px"
  dialog:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.dialog}"
  page-pill-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    size: "40px"
---

# Design System: Central de Relatórios

## Overview

**Creative North Star: "The Warm Desk"**

A calm consumer app laid on warm paper. The ground is a pale oatmeal, content sits on white cards with generous 24px corners and a soft lift, and every control is a pill. Nothing on screen is loud except the things you can press right now: the orange is a promise that tapping it does something immediately. State is told by small coloured dots and plain pt-BR words, never by colour floods.

Density is comfortable rather than tight: a card carries one file (type tile, name, sent date, size, status, action) and the grid steps 1, 2, 3 columns with width. The surface replaces an earlier dark indigo admin table; glass, glow, gradient text and dark mode are not part of this world. The page is light only (`color-scheme: light`).

Motion is short and quiet: entrances fade or rise with an expo ease-out and never overshoot; only a button press gets a slight spring. Everything collapses to near-instant under reduced motion.

**Key Characteristics:**
- Warm neutral ground, white cards, beige tiles; ink is warm brown-black, never pure black.
- One saturated hue (action orange), reserved for live actions, focus and upload progress.
- Pill controls everywhere; 24px cards; 28px dialog/sheet.
- Soft, diffuse, warm-tinted shadows that lift cards off the ground.
- Nunito Sans throughout, bold-leaning, tabular numerals for every number.
- Phones are first-class: the primary action docks to a bottom bar, the dialog becomes a bottom sheet.

## Colors

A warm-paper palette of beige neutrals and brown ink, with a single burnt orange that means "act now" and three quiet state hues.

### Primary
- **Burnt Action Orange** (`action`): the fill of controls that act immediately: "Enviar Relatório", "Baixar", "Selecionar Arquivo", "Tentar novamente" on error states. Also the focus ring, the input caret, the focused search border, the upload icon in the drop zone and the filled arc of the upload ring. White text on it passes AA (about 4.7:1).
- **Deep Orange** (`action-hover`): hover fill of orange actions only.
- **Orange Blush** (`action-soft`): text-selection background, the 4px focus halo around the search input, and the drop zone tint on hover/drag-over.

### Neutral
- **Oatmeal Ground** (`ground`): page background, the drop zone at rest, the focus ring offset and `theme-color`.
- **Card White** (`card`): cards, dialog, search input, unselected chips, the phone bottom bar, text on dark/orange fills.
- **Beige Tile** (`tile`): file-type tiles, skeleton blocks, ghost-button hover, the empty track of the upload ring, the disabled primary fill.
- **Sand Line** (`line`): hairline borders on chips, inputs, secondary buttons, card dividers and the dashed border of unavailable actions.
- **Warm Ink** (`ink`): all primary text, the active filter chip, the current page pill, tooltips, the dialog scrim (at 40%).
- **Soft Ink** (`ink-soft`): secondary text, placeholders, field labels, icons in inputs, border hover, the EXPIRED dot.

### State
- **Ledger Green** (`ok`) on **Mint Wash** (`ok-soft`): AVAILABLE dot; upload success tile.
- **Honey Dot** (`warn-dot`): PENDING and PROCESSING dots. **Bronze Text** (`warn`) on **Cream Wash** (`warn-soft`): upload-URL-expired tile and text; `warn-dot` is for dots only, it is too light for text.
- **Brick Red** (`danger`) on **Rose Wash** (`danger-soft`): ERROR dot, load-error and upload-error tiles, the inline download-error alert.

### Named Rules
**The Press-Only Orange Rule.** Orange appears only on things that act now, plus the focus and progress feedback of those actions. Selection state (active chip, current page) uses ink, never orange. If a control cannot act, it loses the orange entirely: disabled primary goes to `tile` fill with `ink-soft` text, an unavailable download becomes a dashed `line` outline.

**The Dot, Not Badge Rule.** Report status is a 10px dot plus a pt-BR word in `ink`. State colours fill dots and small icon tiles; they never tint a card, a row or a whole button.

## Typography

**Display Font:** Nunito Sans (with system-ui, -apple-system, sans-serif), loaded from Google Fonts with the optical-size axis (6..12) and weights 400 to 800.

**Character:** One rounded humanist sans carries everything; hierarchy comes from weight (400 / 600 / 700 / 800) and size, not from a second family. Numbers are tabular wherever they appear (dates, sizes, counts, pages, percent).

### Hierarchy
- **Display** (700, 26px on phones and 34px from 640px, line-height 1.1, -0.02em): the page title "Central de Relatórios" only.
- **Headline** (800, 20px): dialog titles ("Enviar Relatório"). The empty/error state heading is a softer 700 at 18px.
- **Title** (700, 15.5px, line-height 1.375): the file name on a card, clamped to 3 lines, breaking at `_`, `-` and `.` with the extension kept attached. State headings in the dialog use 800 at 15px.
- **Body** (400, 15px, line-height 1.5): base text; subtitles and descriptions run 14px in `ink-soft` (16px for the header subtitle from 640px).
- **Meta** (600, 14px, tabular): sent date, size, status word, result count, pagination text, chip labels.
- **Label** (400, 12px, `ink-soft`): field labels above a value ("Enviado", "Tamanho"), the exact-date line on phones, the footer.
- **Tile label** (800, 11px, 0.025em, uppercase): the file extension inside the type tile.

### Named Rules
**The Tabular Number Rule.** Every numeral that can change (dates, sizes, counts, page numbers, upload percent) is set with tabular figures so columns and counters do not jitter.

**The Weight Ladder Rule.** Buttons are 700; chips and meta are 600; nothing user-facing drops below 400 or rises above 800.

## Layout

A single centred column, max 1152px wide, with side padding 16px on phones, 24px from 640px and 32px from 1024px; top padding 24px, 40px from 640px. The header row puts the brand tile, title and subtitle on the left and the primary action on the right.

Below it, sections stack 24px apart: the search/filter bar, an optional alert, the card grid, pagination. The filter bar stacks on phones (search, then a horizontally scrollable chip row that bleeds to the screen edges, then the count) and becomes one row from 1024px, with the search capped at 448px and the count pushed right.

The card grid has a 16px gap: one column on phones, two from 640px, three from 1280px. Each card is a 2-column internal grid: tile and name across the top, date left and size right in the middle, then a hairline divider with status left and the action right.

On phones the primary action leaves the header and docks to a fixed white bottom bar (full-width button, safe-area padding, upward shadow); the page adds 128px of bottom padding so the last card clears it. Pagination swaps numbered pills for "Página x de y" below 640px.

**The Thumb Reach Rule.** On phones the primary action lives at the bottom of the screen and spans the width; dialogs open as bottom sheets.

## Elevation & Depth

Depth comes from soft, diffuse shadows tinted with the ink colour (rgba 42, 38, 34), never neutral grey and never hard-edged. Each shadow pairs a tight 1-4px contact shadow with a wide, negatively spread ambient one, so surfaces lift off the warm ground without a visible outline. Cards carry no border; the shadow and the white-on-oatmeal contrast define them.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(42,38,34,0.04), 0 10px 24px -14px rgba(42,38,34,0.18)`): report cards, empty/error card, skeleton cards, the brand tile and the drop-zone icon tile.
- **Lift** (`box-shadow: 0 2px 4px rgba(42,38,34,0.05), 0 18px 32px -16px rgba(42,38,34,0.24)`): card hover (300ms expo ease) and tooltips.
- **Dialog** (`box-shadow: 0 4px 8px rgba(42,38,34,0.06), 0 32px 64px -24px rgba(42,38,34,0.35)`): the upload dialog and bottom sheet, over a 40% ink scrim.
- **Bar** (`box-shadow: 0 -8px 24px -12px rgba(42,38,34,0.18)`): the phone bottom action bar, cast upward.

### Named Rules
**The Warm Shadow Rule.** Shadows are always ink-tinted, soft and negatively spread. Hover deepens a card from Card to Lift; nothing else moves.

## Shapes

Round and friendly. Every interactive control is a full pill (buttons, chips, search input, page buttons, the search clear button). Containers step down in radius by size: the dialog and bottom sheet 28px (top corners only on phones), cards and the drop zone 24px, icon and type tiles plus inline alerts 16px, tooltips 12px. Borders are 1px `line` hairlines; dashed borders mean "not here yet" (the unavailable download, 1px) or "drop here" (the drop zone, 2px). Status is a 10px circle; an unknown status is a hollow ring.

## Components

### Buttons
Soft, round and decisive; every button presses with the same spring.
- **Shape:** full pill (`rounded.pill`), icon and label with an 8px gap, weight 700.
- **Primary:** `action` fill, white text, 44px tall, 20px side padding; hover to `action-hover`. Disabled: `tile` fill, `ink-soft` text, not-allowed cursor, no press scale.
- **Secondary:** `card` fill, `ink` text, 1px `line` border, 44px; hover darkens the border to `ink-soft`. Used for "Cancelar"/"Fechar" and the neutral retry on the empty state.
- **Ghost:** transparent, `ink` text, 40px; hover fills `tile`. Used for close and prev/next icon buttons (disabled at 40% opacity).
- **Press / Focus:** active scales to 0.97 on a soft spring (`cubic-bezier(0.34, 1.4, 0.64, 1)`, 200ms); colour, border and shadow settle on expo ease-out (200ms) without overshoot. Global focus is a 2px `action` ring offset 2px from `ground`.

### Download Action (signature)
- **Available:** 40px orange pill with a download icon and "Baixar"; while fetching it shows a spinner and "Baixando".
- **Unavailable:** the same pill emptied to a 1px dashed `line` outline, `ink-soft` 600 text and a clock icon: "Aguardando" for PENDING, "Indisponível" otherwise. A focusable wrapper keeps the tooltip ("Arquivo indisponível") reachable by keyboard and touch.

### Chips
- **Style:** 40px pills, 16px padding, 600 weight; unselected is `card` with a `line` border (hover border `ink-soft`).
- **State:** the selected chip fills with `ink` and white text (`aria-pressed`). Selection is never orange.

### Cards / Containers
- **Corner Style:** 24px (`rounded.card`).
- **Background:** `card` on `ground`.
- **Shadow Strategy:** Card at rest, Lift on hover (see Elevation & Depth).
- **Border:** none; inner dividers are 1px `line`.
- **Internal Padding:** 20px; 16px between card zones.
- **Empty / error card:** same shell, 56px vertical padding, a 64px tile icon (`tile` for empty, `danger-soft` for error), heading, description and a retry button (primary on error, secondary on empty).
- **Skeleton:** mirrors the report card exactly with pulsing `tile` blocks so nothing jumps when data lands.

### Inputs / Fields
- **Style:** 48px pill, `card` fill, 1px `line` border, 20px padding (44px left when a leading icon sits inside), `ink-soft` placeholder, orange caret.
- **Hover / Focus:** hover darkens the border to `ink-soft`; focus turns the border `action` with a 4px `action-soft` halo instead of the global ring.
- **Search:** leading search icon in `ink-soft`; a 32px round clear button appears when there is text; the native cancel button is hidden.

### Navigation (pagination)
- "Mostrando a–b de n" on the left in meta type; ghost prev/next on the right.
- From 640px, numbered 40px round page buttons: current page is an `ink` pill with white text (`aria-current="page"`), others are plain and fill `tile` on hover. Below 640px, "Página x de y" replaces the numbers.

### Upload Dialog (signature)
- Centred 448px card with 28px radius and 28px padding from 640px, entering with a fade plus slight scale (320ms expo); on phones a bottom sheet with 28px top corners that rises 24px into place.
- Body states: a dashed drop zone on `ground` (the only orange inside it is the upload icon; hover/drag tints it `action-soft`; the drag hint shows only on fine pointers), a progress ring, and result states built from a 56px tone tile (ok / danger / warn) plus a heading, line and a primary retry.
- Footer: a hairline divider, then secondary "Cancelar"/"Fechar" and primary "Selecionar Arquivo".

### Progress Ring (signature)
A 112px ring, 10px stroke: `tile` track with a round-capped `action` arc that fills to the real upload percent (stroke offset eases over 500ms). While the upload URL is being requested the ring spins a short 22% arc (1.1s linear) and announces no value; confirming shows it full. The percent sits inside in 800 weight, tabular, 24px with a 14px "%".

### Tooltip
`ink` fill, white 600 12px text, 12px radius, Lift shadow, ink arrow, 6px offset, fade-in, 200ms open delay. Used for the exact date behind a relative date and for download availability.

## Do's and Don'ts

### Do:
- **Do** reserve `action` orange for controls that act immediately, and for their focus and progress feedback.
- **Do** strip the orange from any action that cannot run: `tile` fill for a disabled primary, a dashed `line` outline for an unavailable download.
- **Do** mark selection (active chip, current page) with an `ink` fill and white text.
- **Do** show state as a 10px dot plus a pt-BR word; keep state colours on dots and small icon tiles.
- **Do** make every control a pill and every content container a white 24px card with the Card shadow.
- **Do** set every changing number in tabular figures.
- **Do** dock the primary action to a full-width bottom bar on phones and open dialogs as bottom sheets.
- **Do** tint shadows with ink (rgba 42, 38, 34) and pair a contact shadow with a negatively spread ambient one.
- **Do** keep entrances on the expo ease-out and give the spring only to button presses.

### Don't:
- **Don't** use orange for selection, decoration, headings or status.
- **Don't** reintroduce the old dark indigo look: no glass, glow, gradient text or dark surfaces.
- **Don't** use pure black or neutral grey for text, scrims or shadows; use `ink` and `ink-soft`.
- **Don't** set text in `warn-dot`; use `warn` for amber text.
- **Don't** add a second typeface; hierarchy comes from Nunito Sans weights.
- **Don't** let entrance animations overshoot.
