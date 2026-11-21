# Graphite Ledger

## Direction

- **Product.** A campus portal where students and admins at one university file complaints, read notices, and trade, lend or recover things.
- **Character.** Orderly, civic, a little warm.
- **World.** The department noticeboard and registrar's desk: printed notices, ledger columns, date stamps.
- **Moments.** The dashboard work queue as a ledger: large tabular counts with a thin share bar per service, and the accent only on open complaints. The activity feed as a dated register.
- **Signature.** Mono "filed" stamps (`.stamp`) for record counts and times, for example `21 Nov · 14:05`. Use them only where records are counted or dated.

## Palette

Neutral graphite ramp for every surface. The content carries the color, the chrome does not.

- Sidebar: `hsl(240 3% 6%)`
- Page: `hsl(240 2% 8%)`
- Card: `hsl(240 4% 10%)`
- Raised (inputs, active row, secondary button): `hsl(240 3% 14%)`
- Hairline border: `hsl(240 3% 16%)`
- Text: primary `hsl(0 0% 93%)`, secondary `muted-foreground` `hsl(240 3% 64%)`, meta and icons `subtle` `hsl(240 3% 53%)`
- Accent, flat violet: `hsl(248 100% 67%)`, with white text. Use it for the primary action, the selected nav icon and the one figure that matters. Nowhere else.

No gradients, glows, radial washes, starfields, colored shadows or backdrop blur. Depth comes from surface steps and hairlines. The `.glass-*` class names survive for compatibility but are plain surfaces now.

## Type

System sans stack (Segoe UI on Windows maps 500 to Semibold, so use 400 for list titles). Weights 400 and 500. Page title 30px, panel titles 18px, body 14px, meta 12px mono. Sentence case, no tracked uppercase labels, `tabular-nums` on every figure.

## Layout

- Flush sidebar rail, 256px, with 36px nav rows and 2px gaps. Content is fluid and capped at 1440px, with page padding of 16, 24 or 32px depending on width.
- Panels: 16px radius, 24px padding, rows separated by hairlines. Controls: 8px radius.
- Operational pages put queues, lists and clear form actions ahead of metric cards. Never show invented counts.

## Motion and accessibility

Use color and background transitions of 150ms on `cubic-bezier(0.22, 1, 0.36, 1)` and a 0.98 press scale on buttons. Nothing loops. Respect reduced motion, keep a visible 2px focus ring and readable contrast.
