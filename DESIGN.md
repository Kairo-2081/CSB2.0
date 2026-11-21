# Obsidian Violet Glass

## Visual direction

Build a campus workspace with the cinematic contrast of a dark observatory:
near-black surfaces sit inside a quiet indigo atmosphere, with a few cool
violet points of light and precise glass edges. The visual signature belongs
to the surrounding field and the primary action, not to a glow on every card.

Use the supplied clip as visual inspiration only. Keep CSB 2.0's identity,
campus terminology, real records, and workflows; do not reuse its brand,
incident-response content, sample metrics, or copy.

## Palette

- Obsidian: `#07070D`
- Canvas: `#0B0B14`
- Glass: `rgba(20, 19, 38, 0.78)`
- Main text: `#F7F6FF`
- Secondary text: `#B6B3CC`
- Electric violet: `#6857FF`
- Soft lilac: `#B5A1FF`
- Cool blue: `#8EA4FF`
- Border: `rgba(196, 187, 255, 0.14)`

## Type

Use the existing system sans stack. Set large, clean headings with compact
line-height; keep interface copy readable and direct. The landing page may use
the system serif stack (`font-display`) for headlines; do not load a web font
without an approved asset.

## Surfaces

- The page background carries a subtle indigo wash and sparse, static points
  of light.
- A near-black rounded canvas separates application content from that outer
  atmosphere on desktop.
- Glass panels use dark translucent fills, a fine cool edge, and soft depth.
- Reserve brighter violet gradients and bloom for primary actions and selected
  navigation. Keep forms, tables, and data surfaces restrained.

## Layout

- Keep the floating navigation rail and give the main workspace a generous
  black canvas.
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
