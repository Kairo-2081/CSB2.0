# Obsidian, Ivory and Saffron

## Visual direction

CSB 2.0 reads like an architecture studio's site for a campus: a near-black
field, ivory type, a saffron accent and real BUET photography in its own
colour, warmed toward the accent. The landing page sets the tone; every signed-in page carries the same
editorial voice through the shared `PageHeader`.

## Palette

- Obsidian (background): `#07070D`
- Panel: `rgba(22, 20, 18, 0.72)` with a `rgba(244, 239, 232, 0.08)` edge
- Ivory (main text): `#F4EFE8`
- Stone (secondary text): `#B7AEA4`
- Saffron (primary action, active marker, headline second clause): `#F2A93B`, hover `#F6BB5C`, text on it `#140D04`
- Light saffron (`--accent`, kickers and highlights): `#F6C26B`
- Status: success, info, warning and destructive tokens in `src/index.css`

## Type

- Display: Instrument Serif (`font-display`, bundled via `@fontsource`). Page
  titles, dialog titles, panel titles and big numbers. It has one weight (400);
  never set it bold, the browser would fake it.
- Interface: Geist (`font-sans`, variable). Geist Mono for code.
- Labels: 11px uppercase with 0.14–0.2em tracking for eyebrows, nav and
  button text on large buttons.

## Photography

Photos live in `public/campus/` as WebP:

- `buet-hero.webp` (1720 px) and `buet-hero-960.webp`: landing hero, sign-in
  panel.
- `bands/*.webp` (1100×520) with `bands/*@2x.webp` (2200×1040) twins: page
  header bands. `PageHeader` picks one with `srcset`.

The source photos are small web-saved copies (455–738 px). Bands are made by
upscaling the source 4× with Real-ESRGAN (x4plus), then grading. Replace them
with camera originals (2000 px or wider) when available.

Photos keep their colour. The grade only normalises exposure, lands blacks on
the page colour and warms highlights toward saffron; the dark fade in
`.page-band-shade` keeps type readable.

## Surfaces

- Panels are matte and warm, with a fine ivory edge and soft depth; no violet
  glow, no star field.
- Corners are small: 6px on controls, 12px on panels.
- Icons are outlined, 1.5px stroke, in saffron or stone. No filled icon tiles.

## Layout

- Keep the floating navigation rail and give the main workspace a generous
  black canvas. The active item gets a 1px saffron marker, not a glow.
- Every signed-in page opens with `PageHeader`: "BUET • section" eyebrow,
  serif title with an optional saffron second clause, a short rule, and the
  page's main action on the right.
- The landing page is the one cinematic surface: a full-bleed BUET campus
  photograph (`public/campus/buet-hero*.webp`), saffron accent `#F2A93B`,
  ivory text `#F4EFE8`, and Instrument Serif headlines. The
  application behind sign-in keeps the violet glass system.
- The landing stats strip shows live BUET counts from
  `/api/public/campus-stats` only once at least two are non-zero; until then it
  shows facts that are true from the code. Never use invented counts or demo
  content.
- Operational pages prioritize useful queues, lists, and clear form actions
  over decorative metric cards.
- On mobile, preserve the same hierarchy without horizontal scrolling and
  keep the navigation control clear of page headings.

## Motion and accessibility

Use short transitions for hover and user-triggered state changes. Keep the
ambient background still, respect reduced motion, preserve visible keyboard
focus, and maintain readable text contrast on translucent surfaces.

## Building blocks (match the design canvas)

- `PageHeader` (`src/components/layout`): the band at the top of every signed-in page. A graded photo from `public/campus/bands`, or no photo with `glow="sand"` (default) or `glow="oxblood"`. Blood donation adds `motif="blood"`: small flat drops and one thin heartbeat line, hidden on phones.
- `src/components/editorial.tsx`: `DateBlock`, `Kicker`, `RowList`, `FilterBar` (underline tabs and search), `CountStrip`, `ObjectTile` (a warm tile with a serif initial for listings without a photo), `EmptyState`, `SectionTitle`.
- `StatusDot` (`src/components/ui/status-dot.tsx`) with `toneFor` and `statusLabel` in `src/lib/status.ts`: status is a dot and a word. Red only for urgent and delete.
- Dialogs open as a full-height panel from the right, with the title in the serif and small-capital labels.
- Prices are shown in taka (`৳ 4,500`).

## Photos

Upscale new photos 4× if they are under 2200 px wide, then run `scripts/grade-photos.py SRC public/campus/bands/NAME@2x.webp --band 2200x1040 --grain` and again with `--band 1100x520` for `NAME.webp`. Prefer real photos; drawn or rendered stand-ins for a page read as AI art next to photographs.

