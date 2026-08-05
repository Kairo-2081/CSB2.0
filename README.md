# Campus Hub - CSB 2.0

A comprehensive campus community management platform designed to streamline campus operations and enhance student-faculty interactions through an integrated digital ecosystem.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Campus Hub** is a full-stack web application that serves as a centralized platform for campus community management. It provides students, faculty, and administrators with tools to collaborate, communicate, and manage campus activities efficiently.

### Key Objectives
- Centralized campus information management
- Streamlined student-faculty communication
- Real-time notifications and updates
- Community-driven features (marketplace, lost & found, blood donation)
- Animal welfare tracking
- Complaint and feedback management
- Student directory and profile management

---

## ✨ Features

### Core Functionalities
- **User Authentication & Authorization**: Role-based access control (Student/Admin)
- **Dashboard**: Personalized user dashboard with activity feed and quick actions
- **Student Directory**: Searchable student profiles with contact information
- **Lost & Found**: Community-driven system for tracking lost/found items
- **Complaints Management**: Submit and track campus complaints with status updates
- **Notices Board**: Campus announcements and important notifications
- **Marketplace**: Buy/sell campus items and services
- **Animal Welfare**: Track and report animal welfare concerns
- **Blood Donation**: Coordinate blood donation drives and donor information
- **Faculty Suggestions**: Submit feedback and suggestions to faculty
- **User Profiles**: Manage personal information and preferences
- **AI Assistant**: Intelligent assistant for campus-related queries

### Advanced Features
- Real-time toast notifications
- Responsive mobile-first design
- Dark mode support
- Form validation with Zod schemas
- Optimized performance with code splitting
- Error handling and recovery mechanisms

---

## 🛠️ Technology Stack

### Frontend
- **Build Tool**: Vite v5.4.19 with React-SWC plugin
- **Framework**: React 18.3.1 with React Router 6.30.1
- **Language**: TypeScript 5.8.3 with strict type checking
- **Styling**: Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Form Management**: React Hook Form 7.61.1 with Zod 3.25.76 validation
- **State Management**: 
  - React Context API (Auth)
  - TanStack React Query 5.83.0 (Server state)
- **Data Fetching**: Native Fetch API with error handling
- **Notifications**: Sonner 1.7.4 (Toast notifications)
- **Icons**: Lucide React 0.462.0
- **Utilities**: 
  - date-fns 3.6.0 (Date operations)
  - next-themes 0.3.0 (Theme management)
  - Embla Carousel 8.6.0 (Carousel components)

### Backend
- **Runtime**: Node.js with Express.js 4.22.1
- **Database**: SQLite3 5.1.7 with sqlite abstraction layer
- **Middleware**: CORS 2.8.5 for cross-origin requests
- **Port**: 3001 (Express development server)
- **Database File**: csb-2.0.db

### Development & Build Tools
- **Package Manager**: npm
- **Linting**: ESLint 9.32.0 with TypeScript support
- **Concurrency**: concurrently 8.2.2 (Run frontend & backend together)
- **Node Version**: 22.16.5 (LTS)

---

## 📁 Project Structure

```
campus-hub-main/
├── public/                     # Static assets
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (reusable)
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── layout/            # Layout components (MainLayout, Sidebar)
│   │   ├── AIAssistant.tsx    # AI assistant component
│   │   ├── ProtectedRoute.tsx # Route protection HOC
│   │   └── NavLink.tsx        # Navigation component
│   ├── contexts/
│   │   └── AuthContext.tsx    # Global auth state management
│   ├── hooks/
│   │   ├── use-mobile.tsx     # Mobile detection hook
│   │   └── use-toast.ts       # Toast notification hook
│   ├── pages/                 # Route page components
│   │   ├── Dashboard.tsx
│   │   ├── Auth.tsx
│   │   ├── LostFound.tsx
│   │   ├── Complaints.tsx
│   │   ├── Notices.tsx
│   │   ├── Marketplace.tsx
│   │   ├── AnimalWelfare.tsx
│   │   ├── BloodDonation.tsx
│   │   ├── Students.tsx
│   │   ├── FacultySuggestions.tsx
│   │   ├── Profile.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── api.service.ts     # Generic API functions
│   │   ├── auth.service.ts    # Authentication service
│   │   ├── database.service.ts # Database operations
│   │   ├── ai-knowledge-base.ts # AI knowledge base
│   │   └── credentials.ts      # Credential management
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles
│   └── vite-env.d.ts          # Vite environment types
├── supabase/
│   ├── config.toml            # Supabase configuration
│   └── migrations/
│       └── init.sql           # Database initialization
├── server.js                  # Express backend server
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.js           # ESLint configuration
├── package.json               # Project dependencies
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+ ([Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git
- Modern web browser

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd campus-hub-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development servers**
```bash
npm run dev
```
This command runs both frontend (Vite on port 8080) and backend (Express on port 3001) concurrently.

### Accessing the Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

---

## 💻 Development

### Available Scripts

```bash
# Start both frontend and backend in development mode
npm run dev

# Start only frontend (Vite dev server with HMR)
npm run dev:frontend

# Start only backend (Express server)
npm run dev:backend

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Run ESLint to check code quality
npm run lint

# Preview production build locally
npm run preview
```

### Development Workflow

1. **Frontend Development**: Vite provides hot module replacement (HMR) for instant feedback
2. **Backend Development**: Express server runs with nodemon-like functionality
3. **API Testing**: Use browser DevTools or Postman to test API endpoints
4. **Database**: SQLite database automatically initializes on first backend run

### Code Quality
- Run `npm run lint` before committing code
- Ensure TypeScript strict mode compliance
- Follow shadcn/ui component patterns
- Use Zod for form validation

---

## 🔌 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Health Check
```http
GET /health
```
Response: `{ success: boolean, database: "ready" | "error" }`

### Authentication Endpoints
```http
POST /auth/login
POST /auth/register
```

### Data Endpoints
```http
GET/POST /complaints
GET/POST /notices
GET/POST /marketplace
GET/POST /animal-welfare
GET/POST /blood-donation
GET/POST /students
GET/POST /faculty-suggestions
GET/POST /lost-found
```

### Authentication
- Requests are authenticated via JWT tokens stored in localStorage
- Include token in `Authorization: Bearer <token>` header
- Server validates token before processing requests

---

## 🗄️ Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique user identifier |
| name | TEXT | User full name |
| email | TEXT (UNIQUE) | Email address |
| password | TEXT | Hashed password |
| role | TEXT | 'admin' or 'student' |
| phone | TEXT | Contact number |
| department | TEXT | Department/faculty |
| created_at | TEXT | Account creation timestamp |
| updated_at | TEXT | Last update timestamp |

### Related Tables
- **complaints**: Issue tracking and resolution
- **notices**: Campus announcements
- **marketplace**: Buy/sell items
- **animal_welfare**: Animal care reports
- **blood_donation**: Donor and donation records
- **students**: Student profiles
- **faculty_suggestions**: Feedback submissions
- **lost_found**: Lost/found item tracking

---

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
