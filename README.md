# PNMC Management System

Enterprise-grade Nursing & Midwifery Council Management System — **single Next.js full-stack project**.

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React, Redux Toolkit, Material UI, React Query, React Router (in-app) |
| Backend | Express API (same repo), **JSON file database**, JWT, RBAC |
| Storage | Local disk (dev) or Cloudinary (production) |
| Deployment | Vercel (recommended) or self-hosted Node server |

## Quick Start (local)

### Prerequisites
- Node.js 20+

### Setup

```bash
cp .env.example .env
npm install
npm run seed    # creates ./data/*.json with demo records
```

### Run

```bash
npm run dev
```

Opens **http://localhost:3000** — UI and API (`/api`, `/health`) on the same port.

All configuration lives in a single root `.env` file.

## Production deployment

### Vercel (recommended)

1. Import the repo with **Root Directory** = `.` (project root).
2. Set environment variables from `.env.example` in Vercel → Settings → Environment Variables.
3. API routes are served via `api/index.js` (serverless Express); the UI is built with Next.js.

Health check: `GET /health` should return `"storage": "json"` and `"db": "connected"`.

### Self-hosted

```bash
npm run build
NODE_ENV=production npm start
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
├── .env                    # All secrets & config (not committed)
├── api/                    # Vercel serverless Express entry
├── data/                   # JSON database (one file per collection)
│   ├── users.json
│   ├── students.json
│   └── ...
├── server.js               # Local dev / self-hosted (Next.js + Express)
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React UI components
│   ├── server/             # Express API (controllers, models, routes, …)
│   ├── views/              # Page components (routed via React Router)
│   ├── features/           # Redux slices
│   ├── services/           # API client
│   └── store/              # Redux store
```

## License

Proprietary — Pakistan Nursing & Midwifery Council
