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
