# FitAI - Smart Gym Management + AI Fitness Tracker

FitAI is a production-focused MERN monorepo with AI integration, realtime communication, and role-based architecture for users, trainers, and admins.

This repository currently includes Step 1 setup completion: project scaffolding, dependencies, base architecture, security baseline, and runnable frontend/backend foundations.

## 1. Step-by-Step Project Setup

### 1.1 Prerequisites

- Node.js 20+
- npm 10+
- MongoDB local or Atlas URI
- Firebase project (for push notifications)
- OpenAI API key
- Google OAuth credentials

### 1.2 Install Dependencies

Run from repository root:

```bash
npm install
npm install --workspace client
npm install --workspace server
```

### 1.3 Configure Environment Variables

Create env files from examples:

- `client/.env` from `client/.env.example`
- `server/.env` from `server/.env.example`

Minimum variables for local run:

- `server/.env`
  - `PORT=5000`
  - `CLIENT_ORIGIN=http://localhost:5173`
  - `MONGODB_URI=<your_mongo_uri>`
  - `JWT_ACCESS_SECRET=<strong_secret>`
  - `JWT_REFRESH_SECRET=<strong_secret>`
- `client/.env`
  - `VITE_API_URL=http://localhost:5000/api`
  - `VITE_SOCKET_URL=http://localhost:5000`

### 1.4 Run the Project

From root:

```bash
npm run dev
```

This launches:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

If MongoDB is not available yet, temporary local boot is possible with:

```bash
# in server/.env
SKIP_DB_CONNECTION=true
```

## 2. Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Mongoose
- Auth foundation deps: JWT, Passport Google OAuth
- AI foundation deps: OpenAI SDK
- Realtime: Socket.io
- Notifications foundation deps: Firebase + Nodemailer
- Charts deps: Recharts

## 3. Project Structure

```text
/client
  /src
    /components
    /pages
    /hooks
    /services
    /context
    /utils
/server
  /src
    /controllers
    /models
    /routes
    /middlewares
    /services
    /config
    /sockets
    /jobs
```

## 4. What Step 1 Includes

- Monorepo root scripts and workspace wiring
- React app with routing scaffold for:
  - Landing
  - User dashboard
  - Trainer dashboard
  - Admin dashboard
  - AI trainer page
- Dark neon theme with Tailwind and glassmorphism base components
- Express backend bootstrap with:
  - Security middleware (`helmet`, `cors`, `rate-limit`)
  - Health endpoint (`/api/health`)
  - Centralized error and not-found middleware
  - MongoDB connection utility
  - Socket.io server initialization
  - Environment validation with Zod

## 5. Next Implementation Steps

- Step 2: Authentication (JWT access/refresh + Google OAuth + forgot/reset)
- Step 3: Database schemas and full API modules (workout, diet, progress, booking, notifications)
- Step 4: AI trainer with context memory
- Step 5: Realtime reminders + push notification service
- Step 6: Role dashboards with charts and analytics integration
- Step 7: Deployment on Vercel + Render/Railway + Atlas

## 6. Deployment Targets (Planned)

- Frontend: Vercel
- Backend: Render or Railway
- Database: MongoDB Atlas
