# Campus Hub (CSB 2.0)

Campus Hub is a full-stack web app for everyday campus life. Students and admins share notices, report complaints, trade in a marketplace, track lost items, coordinate blood donation and animal welfare, and more. It is a React single-page app on top of an Express API with a SQLite database.

This repository is a fork of [unthinkingFool/CSB2.0](https://github.com/unthinkingFool/CSB2.0).

## Contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [API reference](#api-reference)
- [Database](#database)
- [Authentication and security](#authentication-and-security)
- [Known limitations](#known-limitations)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Roadmap](#roadmap)

## Overview

Campus Hub gives students and administrators one place for campus activity. Students sign up, post to and browse the modules listed below, and manage their own entries; admins can remove content posted by others, such as complaints. The whole backend is a single Express file (`server.js`) that creates the SQLite database on first run.

## Features

- **Accounts and roles**: sign up, sign in and change your password. There are two roles, `student` and `admin`; new sign-ups are always students.
- **Dashboard**: the landing page after sign-in, with summary cards. The subtitles on those cards are static placeholder text.
- **Students**: a list of registered users with search and a role filter.
- **Complaints**: submit complaints with a category and track their status. You can delete your own; admins can delete any.
- **Notices**: campus announcements with a category.
- **Marketplace**: list items for sale with a price and a contact number.
- **Lost and found**: report lost or found items with a location and contact number.
- **Bicycles**: post bicycle entries with brand, colour, location and contact details.
- **Animal welfare**: report animals that need help, with a location and an urgency level.
- **Blood donation**: list donors by blood type, location and availability date.
- **Faculty suggestions**: leave feedback and a rating for a faculty member.
- **Profile**: view and edit your own details.
- **Assistant**: a chat widget that answers from a built-in knowledge base (`src/services/ai-knowledge-base.ts`). It runs in the browser and calls no external AI service.
- **Interface**: shadcn/ui components and toast notifications.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript 5.8, Vite 5 with the React SWC plugin, React Router 6, Tailwind CSS 3, shadcn/ui (Radix UI), Sonner, Lucide icons |
| Backend | Node.js (ES modules), Express 4, CORS |
| Database | SQLite through `sqlite3` and `sqlite`, stored in `campus-hub.db` |
| Optional | Supabase JS client and `supabase/migrations/init.sql`, used only by the database test page and two sample components |
| Tooling | ESLint 9, `concurrently` |

## Project structure

```text
.
├── server.js            Express API and SQLite setup (port 3001)
├── start-dev.js         Helper that starts the backend and the frontend together
├── campus-hub.db        SQLite database file, created on first run (a copy is committed)
├── src/
│   ├── pages/           One component per route: Dashboard, Auth, Complaints, Notices, ...
│   ├── components/      ui/ (shadcn/ui), dashboard/, layout/, AIAssistant, ProtectedRoute
│   ├── contexts/        AuthContext
│   ├── services/        API, auth and database services, plus the assistant's knowledge base
│   ├── integrations/    Supabase client and generated types
│   ├── hooks/, lib/     Shared hooks and utilities
│   └── App.tsx, main.tsx
├── supabase/            config.toml and migrations/init.sql
├── public/              Static assets
└── vite.config.ts, tailwind.config.ts, eslint.config.js, ...
```

## Getting started

### Prerequisites

- Node.js 18 or newer and npm.
- Git.

### Install and run

```bash
git clone https://github.com/Kairo-2081/CSB2.0.git
cd CSB2.0
npm install
npm run dev
```

`npm run dev` starts the Vite frontend and the Express backend together.

| What | URL |
| --- | --- |
| Frontend | http://localhost:8080 |
| API | http://localhost:3001/api |
| Health check | http://localhost:3001/api/health |

On first run the backend creates the tables in `campus-hub.db` and, if the `users` table is empty, seeds one admin and five student accounts (see `server.js`). You can also create an account from the sign-up form.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the frontend and the backend together. |
| `npm run dev:frontend` | Start only the Vite dev server (port 8080). |
| `npm run dev:backend` | Start only the API with `node server.js` (port 3001). It does not reload on changes. |
| `npm run build` | Build the frontend into `dist/`. |
| `npm run build:dev` | Build the frontend in development mode. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint. |

## API reference

Base URL: `http://localhost:3001/api`. See [Known limitations](#known-limitations) before relying on any of these routes for access control.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Server and database status. |
| POST | `/auth/login` | Sign in with `email` and `password`. |
| POST | `/auth/register` | Create a student account. |
| POST | `/auth/change-password` | Change a user's password. |
| GET | `/auth/verify` | Look up the user named in the `Authorization: Bearer <user id>` header. |
| GET | `/auth/users` | List users (id, name, email, role, phone, department). |

Each content module has the same three routes: `GET /<module>` to list, `POST /<module>` to create and `DELETE /<module>/:id` to remove.

| Module path | Content |
| --- | --- |
| `/complaints` | Complaints with category and status |
| `/notices` | Announcements |
| `/marketplace` | Items for sale |
| `/lost-found` | Lost and found items |
| `/bicycles` | Bicycle entries |
| `/animal-welfare` | Animal welfare reports |
| `/blood-donation` | Blood donors |
| `/faculty-suggestions` | Faculty feedback and ratings |

## Database

SQLite, in `campus-hub.db` at the project root. `server.js` creates every table with `CREATE TABLE IF NOT EXISTS` on startup.

| Table | Main columns |
| --- | --- |
| `users` | `id`, `name`, `email` (unique), `password`, `role` (`student` by default), `phone`, `department`, `created_at`, `updated_at` |
| `complaints` | `title`, `description`, `category`, `posted_by`, `status`, `user_id` |
| `notices` | `title`, `description`, `category`, `posted_by` |
| `marketplace` | `title`, `description`, `price`, `seller`, `phone` |
| `lost_found` | `title`, `description`, `item_type`, `status` (`lost` by default), `location`, `contact_number`, `user_id` |
| `bicycles` | `brand`, `color`, `location`, `contact_number`, `description` |
| `animal_welfare` | `title`, `description`, `location`, `urgency` |
| `blood_donation` | `name`, `blood_type`, `contact_number`, `location`, `available_date` |
| `faculty_suggestions` | `title`, `faculty_name`, `rating`, `feedback` |

Every table also has `id`, `created_at` and `updated_at`. Passwords are stored exactly as entered; see [Authentication and security](#authentication-and-security).

## Authentication and security

This is a prototype-level login, not production authentication.

1. The sign-in form posts the email and password to `POST /api/auth/login`.
2. The server looks for a `users` row with that exact email and password, and returns the user object. It does not issue a token.
3. The frontend keeps that user in `localStorage` and in `AuthContext`. `ProtectedRoute` redirects visitors who are not signed in to `/auth`, and routes marked admin-only send other users back to the dashboard.
4. Requests to `/auth/verify` use the user's id as the bearer value.

Sign-up checks the email format and that the password has at least 8 characters, with an upper-case letter, a lower-case letter, a digit and one of `@$!%*?&`. The database stores the password as typed.

## Known limitations

Read these before deploying or entering real data.

- **Passwords are stored in plain text** and compared directly in SQL. Use throwaway passwords only.
- **The API does not check who is calling.** No route verifies a session or token, and rules such as "delete your own complaint, or any if you are an admin" use the `userId` and `userRole` sent by the client. Treat all data as publicly readable and writable. `GET /auth/users` lists every user's email and phone number.
- **The API address is hard-coded.** `http://localhost:3001/api` appears in `src/services/*.ts` and in some pages, so the frontend only works against a backend on the same machine.
- **CORS is open to every origin.**
- **Repository contents:** the SQLite file, `.env` (Supabase project settings) and default seed accounts are committed.
- **Unused dependencies:** Zod and React Hook Form are installed but not used for form validation.

## Deployment

The app is built for local use. To run it on a server today:

1. Build the frontend with `npm run build` and serve `dist/` from any static host.
2. Run `node server.js` on the same host, since the frontend calls `http://localhost:3001/api`. Changing that means editing the `API_URL` constants in `src/services/` and the fetch calls in `src/pages/`.
3. Keep `campus-hub.db` somewhere that persists, because the server reads and writes it in place.

The Express server does not serve `dist/` itself, and the frontend does not read `VITE_API_URL`. Fix the points under [Known limitations](#known-limitations) before exposing it to the internet.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/Kairo-2081/CSB2.0/issues).

1. Create a feature branch: `git checkout -b feature/short-name`
2. Commit your changes with a clear message.
3. Run `npm run lint` and try the change locally with `npm run dev`.
4. Push the branch and open a pull request.

## License

No license file is included. The project was built as part of a hackathon, so contact the maintainers before reusing it.

## 🎯 Roadmap

- [ ] Integrate Supabase for cloud database
- [ ] Add email notifications
- [ ] Implement real-time chat
- [ ] Mobile app (React Native)
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] API rate limiting
- [ ] Webhook integrations

---

**Last Updated**: December 2025 | **Version**: 2.0
