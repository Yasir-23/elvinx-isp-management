ElvinX Radius Monorepo
======================

Structure
- backend/  -> Express + node-routeros (MikroTik API bridge)
- frontend/ -> Vite + React + Tailwind dashboard (dark)

Quick start (development)
1. Backend
   cd backend
   npm install
   cp .env.example .env   # edit .env with your RouterOS credentials
   npm run dev

2. Frontend
   cd frontend
   npm install
   npm run dev

Notes
- frontend dev server proxies /api to backend (see vite.config.js)
- For production: build frontend (npm run build) and start backend; backend serves frontend/dist
