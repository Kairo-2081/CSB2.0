# Obsidian, Ivory and Sand

## Visual direction

CSB 2.0 reads like an architecture studio's site for a campus: a near-black
field, ivory type, a warm sand accent and real BUET photography graded toward
dusk. The landing page sets the tone; every signed-in page carries the same
editorial voice through the shared `PageHeader`.

## Palette

- Obsidian (background): `#07070D`
- Panel: `rgba(22, 20, 18, 0.72)` with a `rgba(244, 239, 232, 0.08)` edge
- Ivory (main text): `#F4EFE8`
- Stone (secondary text): `#B7AEA4`
- Sand (primary action, active marker): `#A88D76`, hover `#BCA08A`
- Pale sand (accent lines in headlines): `#CDB9A5`
- Status: success, info, warning and destructive tokens in `src/index.css`

## Type

- Display: the system serif stack (`font-display`: Iowan Old Style, Palatino,
  Georgia). Use it for page titles, dialog titles, panel titles and big
  numbers, at weight 400 with tight tracking. Don't load a web font without an
  approved asset.
- Interface: the system sans stack for everything else.
- Labels: 11px uppercase with 0.14–0.2em tracking for eyebrows, nav and
  button text on large buttons.

## Photography

Photos live in `public/campus/` as WebP:

- `buet-hero.webp` (1720 px) and `buet-hero-960.webp`: landing hero, sign-in
  panel. The only photo sharp enough to fill a screen.
- `buet-day-reflection.webp` (640 px) and `buet-dusk-reflection.webp`
  (531 px): the dashboard picks one by time of day; the 404 uses the day one.
  Keep these at their native size or smaller, since they blur when stretched.

Grade every photo down (`.landing-photo`, `.auth-photo`, `.dashboard-photo`)
so type always sits on a dark, warm field.

## Surfaces

- Panels are matte and warm, with a fine ivory edge and soft depth; no violet
  glow, no star field.
- Corners are small: 6px on controls, 12px on panels.
- Icons are outlined, 1.5px stroke, in pale sand. No filled icon tiles.

## Layout

- Keep the floating navigation rail and give the main workspace a generous
  black canvas. The active item gets a 1px sand marker, not a glow.
- Every signed-in page opens with `PageHeader`: "BUET • section" eyebrow,
  serif title with an optional pale-sand second clause, a short rule, and the
  page's main action on the right.
- The landing page is the one cinematic surface: a full-bleed BUET campus
  photograph graded to dusk (`public/campus/buet-hero*.webp`), warm sand accent
  `#A88D76`, ivory text `#F4EFE8`, and a system serif display stack
  (`font-display`, Iowan / Palatino / Georgia) for headlines only. The
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

Run new photos through `scripts/grade-photos.py --band 1100x520 --grain` into `public/campus/bands`. Prefer real photos; drawn or rendered stand-ins for a page read as AI art next to photographs.

