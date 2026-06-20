# AR Kids Treasure Hunt Game

Mobile-first AR-style treasure hunt for children aged 3–6.

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs at **http://localhost:3001**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:5173** (proxies `/api` to backend)

Open on a phone in **landscape** mode, or use Chrome DevTools mobile emulation with camera access.

## Deploy on Render

Deploy as **two services** from the `Vibe-coding` repo.

### 1. Backend — Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `ar-kids-game/backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Environment variables (optional):

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |

Copy the live URL, e.g. `https://your-backend.onrender.com`.

### 2. Frontend — Static Site

| Setting | Value |
|---------|-------|
| Root Directory | `ar-kids-game/frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variables (**required** — set before the first build):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

Replace `your-backend` with your actual Render backend URL.

### Local production test

Copy the example env file and set your backend URL:

```bash
cd frontend
cp .env.example .env
# edit .env → VITE_API_URL=https://your-backend.onrender.com/api
npm run build && npm run preview
```

## Project Structure

```text
ar-kids-game/
├── frontend/   Vite + Three.js game client
├── backend/    Express REST API
├── shared/     JSON game configuration
└── docs/       Architecture, API, game design
```

## Documentation

- [Architecture](docs/architecture.md)
- [API Spec](docs/api-spec.md)
- [Game Design](docs/game-design.md)

## Tech Stack

**Frontend:** Vite, Three.js, Tone.js, GSAP, HTML, CSS  
**Backend:** Node.js, Express  
**Data:** Shared JSON configuration files
