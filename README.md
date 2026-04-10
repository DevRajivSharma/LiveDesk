# LiveDesk

LiveDesk is a real-time collaboration workspace with a shared code editor, whiteboard, room-based sessions, file snapshots, authentication, and live presence via Socket.IO.

The production frontend is hosted at [livedesk-live.vercel.app](https://livedesk-live.vercel.app).

## What Is In This Repo

- `frontend/`: Vite + React client
- `backend/`: Express + Socket.IO API server

## Core Features

- Real-time collaborative rooms
- Shared code editor and whiteboard
- Live cursors and participant presence
- Room snapshots and saved files
- Email-based auth flows
- Google and GitHub OAuth support

## Tech Stack

- Frontend: React, Vite, Tailwind, Socket.IO client
- Backend: Express, Socket.IO, MongoDB with Mongoose, Redis, JWT
- Deployment: Vercel frontend, Node backend

## Project Structure

```text
LiveDesk/
|- frontend/
|  |- src/
|  |- .env
|  `- .env.example
|- backend/
|  |- routes/
|  |- models/
|  |- .env
|  `- .env.example
`- README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB
- Redis

Optional services:

- Email API service for OTP and password reset emails
- Google OAuth app
- GitHub OAuth app

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd LiveDesk
cd frontend
npm install
cd ..\backend
npm install
```

### 2. Configure environment files

Copy the example files in both apps:

```bash
cd frontend
copy .env.example .env
cd ..\backend
copy .env.example .env
```

Then update the values you need.

## Environment Setup

### Frontend

File: `frontend/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Backend HTTP base URL |
| `VITE_SOCKET_URL` | Yes | Backend Socket.IO base URL |

Local defaults:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### Backend

File: `backend/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | Yes | Backend server port |
| `MONGO_URI` | Yes | MongoDB server URI without the database name suffix |
| `DB_NAME` | Yes | MongoDB database name |
| `JWT_SECRET` | Yes | JWT signing secret |
| `FRONTEND_URL` | Yes | Frontend origin used in auth/reset redirects |
| `REDIS_URL` | Yes | Redis connection string |
| `EMAIL_API_URL` | Recommended | External email API used for OTP and reset emails |
| `EMAIL_SERVICE` | Optional | Mail provider label for your own reference |
| `EMAIL_USER` | Optional | Mail account username |
| `EMAIL_PASS` | Optional | Mail account password or app password |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth client id |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth client secret |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GITHUB_CALLBACK_URL` | Optional | GitHub OAuth callback |
| `GOOGLE_CALLBACK_URL` | Optional | Google OAuth callback |

Important:

- `MONGO_URI` should be the server base, for example `mongodb://127.0.0.1:27017`
- `DB_NAME` is appended in code, so do not duplicate the database name in both places unless you also change the server connection logic
- Email and OAuth features will not work until their related variables are configured

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Production Notes

- Public frontend: [https://livedesk-live.vercel.app](https://livedesk-live.vercel.app)
- When deploying the backend, set `FRONTEND_URL` to your live frontend origin
- OAuth callback URLs must match the backend deployment URL, not the frontend URL
- Socket and API frontend variables should point to the backend base URL

## Recommended Onboarding Flow For New Developers

1. Install dependencies in `frontend` and `backend`
2. Start MongoDB and Redis locally
3. Copy both `.env.example` files to `.env`
4. Fill in backend required values first
5. Start the backend, then the frontend
6. Add OAuth and email credentials only if those flows are needed

## Current Scripts

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

Backend:

```bash
npm run dev
npm start
```

## Notes

- The frontend is intentionally desktop-first and shows a warning on small/mobile screens
- Redis is used for session handling
- Password reset and OTP flows depend on `EMAIL_API_URL`
