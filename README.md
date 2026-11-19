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

## 🔐 Authentication & Security

### Authentication Flow
1. User submits email/password via Auth page
2. Backend validates credentials and checks server health
3. JWT token generated and stored in localStorage
4. Token used for subsequent API requests
5. AuthContext manages global auth state

### Authorization
- **Protected Routes**: ProtectedRoute component checks authentication
- **Role-Based Access**: Student/Admin roles with conditional rendering
- **Server Health**: Verified before each login attempt

### Security Best Practices
- Passwords stored as hashed values in database
- CORS enabled for localhost development
- Error messages sanitized for production
- Sensitive data never logged or cached insecurely

---

## 🌐 Deployment

### Build for Production
```bash
npm run build
```
Creates optimized production bundle in `dist/` directory.

### Hosting Options

#### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Vercel auto-deploys on push

#### Netlify
1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Set publish directory: `dist`

#### Traditional Hosting (VPS/Shared Hosting)
1. Build frontend: `npm run build`
2. Deploy `dist/` folder to web server
3. Set up Node.js environment for backend
4. Configure environment variables
5. Start backend: `node server.js`

### Environment Variables
Create `.env.local` for development:
```
VITE_API_URL=http://localhost:3001/api
```

For production, set appropriate backend API URL.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

### Code Standards
- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Test changes before submitting PR

---

## 📄 License

This project is part of a hackathon initiative. For licensing information, please contact the project maintainers.

---

## 📞 Support & Contact

For issues, feature requests, or questions:
1. Open an issue on GitHub
2. Contact the development team
3. Check existing documentation

---

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
