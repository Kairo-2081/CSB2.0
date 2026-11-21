# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University students and administrators using campus services for notices, complaints, lost-and-found items, marketplace listings, bicycle sharing, university-scoped lending and borrowing, animal welfare, blood donation, and faculty suggestions.

## Product Purpose

CSB 2.0 is a campus services portal that gives users one place to find information and complete everyday university requests.

## Positioning

An operational university noticeboard that combines real campus service records with fast browsing and submission workflows.

## Operating Context

Users access the app through desktop and mobile browsers. Administrators also manage university network information and user-facing records.

## Capabilities and Constraints

- The app uses React, Vite, and an Express/SQLite backend.
- Real module records come from local API endpoints.
- Lending listings and borrow requests are restricted to the signed-in user's university.
- Profile data may include name, email, phone, department, and role.
- User-facing claims and counts must come from the database rather than fabricated copy.
- The existing route structure and module functions must remain intact.

## Brand Commitments

- Preserve the CSB 2.0 name.
- Keep campus services and university administration accurate and factual.
- Use IBM Plex Sans and IBM Plex Mono, self-hosted (approved 2026-11-21).

## Evidence on Hand

- Existing SQLite-backed complaints, notices, marketplace, lost-and-found, bicycle, blood-donation, animal-welfare, and faculty-suggestion data.
- Existing page routes and navigation.

## Product Principles

- Make real tasks faster to find and complete.
- Prefer clear records and work queues over decorative dashboards.
- Keep claims tied to real data.
- Make the interface responsive and keyboard accessible.

## Accessibility & Inclusion

Use visible keyboard focus, readable text contrast, reduced-motion support, and responsive layouts.
