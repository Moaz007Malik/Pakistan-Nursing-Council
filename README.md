# PNMC Management System

Enterprise-grade Nursing & Midwifery Council Management System built with the MERN stack.

The application lives in two folders only — each with its own `.env`:

| Folder | Purpose | Env file |
|--------|---------|----------|
| `backend/` | Express API, MongoDB, uploads | `backend/.env` |
| `frontend/` | React SPA (Vite) | `frontend/.env` |

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Redux Toolkit, Material UI, React Query, React Hook Form, Chart.js, React Router |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, RBAC |
| Storage | Local disk (dev) or Cloudinary (production) |
| Deployment | Vercel (frontend + optional backend), Render (persistent API) |

## Quick Start (local)

### Prerequisites
- Node.js 20+
- MongoDB ([MongoDB Atlas](https://www.mongodb.com/atlas) or local)

### Setup

```bash
# Backend
cp backend/.env.example backend/.env
cd backend && npm install && npm run seed

# Frontend (new terminal)
cp frontend/.env.example frontend/.env
cd frontend && npm install
```

### Run

```bash
# Terminal 1 — API on http://localhost:5000
cd backend && npm run dev

# Terminal 2 — UI on http://localhost:3000
cd frontend && npm run dev
```

`frontend/.env` uses `VITE_API_URL=/api` and proxies to `http://localhost:5000` via Vite.  
All backend secrets and MongoDB config go in `backend/.env` only.

## Production deployment

### Backend

**Option A — Render (recommended, persistent server)**

1. Create a Web Service with **Root Directory** = `backend`, **Start Command** = `npm start`.
2. Or use **Blueprint** with `backend/render.yaml`.
3. Set env vars from `backend/.env.example` in the Render dashboard (`MONGODB_URI`, JWT secrets, `FRONTEND_URL`, Cloudinary, etc.).

**Option B — Vercel (serverless)**

1. Import repo with **Root Directory** = `backend`.
2. Copy env vars from `backend/.env.example` into Vercel Project → Settings → Environment Variables.
3. Redeploy after env changes: `cd backend && vercel --prod`.

Health check: `GET /health` should return `"db": "connected"`.

### Frontend (Vercel)

1. Import repo with **Root Directory** = `frontend`.
2. Set `VITE_API_URL` to your API base + `/api`, e.g. `https://pnmc-backend.vercel.app/api`.
3. Redeploy after changing env vars.

Set `FRONTEND_URL` on the backend to your live frontend URL for CORS.

### Seed production database (once)

```bash
cd backend
MONGODB_URI="your-atlas-uri" npm run seed
```

## Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@pnmc.com | Admin@123 |
| Council Member | council@pnmc.com | Council@123 |
| Committee Member | committee@pnmc.com | Committee@123 |
| Field Officer | field@pnmc.com | Field@123 |
| Finance Officer | finance@pnmc.com | Finance@123 |
| Monitoring Officer | monitoring@pnmc.com | Monitor@123 |
| Institution Admin | institution@pnmc.com | Inst@123 |
| Student | student@pnmc.com | Student@123 |
| Faculty | faculty@pnmc.com | Faculty@123 |

## Project Structure

```
PNC/
├── backend/
│   ├── .env                 # Backend secrets (not committed)
│   ├── api/                 # Vercel serverless entry
│   ├── render.yaml          # Render blueprint
│   ├── vercel.json
│   └── src/
│       ├── config/          # loadEnv.js → backend/.env only
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── seeds/
└── frontend/
    ├── .env                 # VITE_* vars (not committed)
    ├── vercel.json
    └── src/
        ├── components/
        ├── features/
        ├── pages/
        ├── routes/
        └── services/
```

## Security

- JWT access tokens (15min) + refresh tokens (7 days)
- Role-based access control (10 roles, 40+ permissions)
- Rate limiting (100 req/15min API, 10 req/15min auth)
- Helmet security headers
- Audit logging with IP tracking

## License

Proprietary — Pakistan Nursing & Midwifery Council
