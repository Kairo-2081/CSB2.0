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

IBM Plex Sans for the interface and IBM Plex Mono for stamps, emails, phone numbers and IDs. Both are self-hosted through `@fontsource`. Plex suits a registrar's office: institutional and exact, with enough warmth in its curves. Weights are 400 and 500, with 600 only for the logo mark. Page titles are 30px, the landing headline 64px (40px on phones), panel titles 18px, body 14px and stamps 12px. Large figures use the sans with `tabular-nums`, not the mono. Sentence case everywhere, no tracked uppercase labels, and no trailing periods on labels or buttons.

## Layout

- Flush sidebar rail, 256px, with 36px nav rows and 2px gaps. Content is fluid and capped at 1440px, with page padding of 16, 24 or 32px depending on width.
- Panels: 16px radius, 24px padding, rows separated by hairlines. Controls: 8px radius.
- Operational pages put queues, lists and clear form actions ahead of metric cards. Never show invented counts.
- Every signed-in page uses `Page` and `PageHeader` (title, one-line description, a mono count stamp, and actions on the right), then a `Toolbar` with `SearchField` and `FilterGroup`, then the records.
- Lists of records are one panel with hairline rows. Items people browse visually (lost and found, marketplace, bicycles, donors) are a grid of cards with 20px padding.
- Filters use `FilterGroup`, where the selected option is a raised step, not the accent. Empty states use `EmptyState`. Statuses use `Badge` variants `success`, `warning`, `destructive` and `info` with a small dot.

## Motion and accessibility

Use color and background transitions of 150ms on `cubic-bezier(0.22, 1, 0.36, 1)` and a 0.98 press scale on buttons. Nothing loops. Respect reduced motion, keep a visible 2px focus ring and readable contrast.
