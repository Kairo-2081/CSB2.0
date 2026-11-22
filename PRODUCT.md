# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

BUET students and administrators first; other Bangladeshi public universities later. Users rely on campus services for notices, complaints, lost-and-found items, marketplace listings, bicycle sharing, university-scoped lending and borrowing, animal welfare, blood donation, and faculty suggestions.

## Product Purpose

CSB 2.0 is a campus services portal that gives users one place to find information and complete everyday university requests.

## Positioning

An operational university noticeboard that combines real campus service records with fast browsing and submission workflows.

## Operating Context

Users access the app through desktop and mobile browsers. Administrators also manage university network information and user-facing records.

## Capabilities and Constraints

- The app uses React and Vite on an Express API over PostgreSQL. All SQL lives in `schema.sql`.
- Real module records come from the API; every list is restricted to the signed-in user's university.
- Access rules (sign-in, ownership, admin-only actions) are enforced in the database functions, not only in the UI.
- Profile data may include name, email, phone, department, and role. Phone and email are shown to other students only when the student opts in.
- User-facing claims and counts must come from the database rather than fabricated copy.
- The existing route structure and module functions must remain intact.

## Brand Commitments

- Preserve the CSB 2.0 name.
- Launch at BUET only. Registration is limited by `OPEN_UNIVERSITIES` (default `buet`).
- Keep campus services and university administration accurate and factual.
- Type is Instrument Serif (display) and Geist (interface), bundled with the app.

## Evidence on Hand

- Database-backed complaints, notices, marketplace, lost-and-found, bicycle, blood-donation, animal-welfare, faculty-suggestion and lending records.
- Existing page routes and navigation.

## Product Principles

- Make real tasks faster to find and complete.
- Prefer clear records and work queues over decorative dashboards.
- Keep claims tied to real data.
- Make the interface responsive and keyboard accessible.

## Accessibility & Inclusion

Use visible keyboard focus, readable text contrast, reduced-motion support, and responsive layouts.
