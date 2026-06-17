# PNMC Management System

Enterprise-grade Nursing & Midwifery Council Management System built with the MERN stack.

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Redux Toolkit, Material UI, React Query, React Hook Form, Chart.js, React Router |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, RBAC |
| Storage | Local disk (dev) or Cloudinary (production) |
| Deployment | Vercel (frontend), Render (API) |

## Modules

1. **Institution Registration** — Application workflow with field inspection, committee & council approval
2. **Affidavit Management** — PDF storage, digital signature, QR verification
3. **Field Officer Management** — Inspection forms, photos, geolocation, scoring
4. **Committee Management** — Review, voting, meeting scheduler, minutes
5. **Council Management** — Final approval, resolutions, voting results
6. **Student Management** — Registration form (PNMC reference), QR ID cards
7. **Student Attendance** — Biometric, face recognition, manual adjustment
8. **Student Renewal** — Annual renewal with payment gateway
9. **Faculty Management** — Registration, documents, council approval
10. **Faculty Attendance** — Daily logs, late arrival, overtime
11. **Biometric Integration** — ZKTeco, eSSL, Suprema adapters
12. **Real-Time Monitoring** — Camera streams and snapshots
13. **Payment Module** — Stripe, Easypaisa, JazzCash abstraction
14. **Notification System** — Email, SMS, WhatsApp, In-App
15. **Audit System** — Full action tracking with IP logging

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB ([MongoDB Atlas](https://www.mongodb.com/atlas) recommended, or local install)

### Local Development

```bash
cp backend/.env.example backend/.env
npm run install:all
npm run seed          # seed local MongoDB
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

Files are uploaded to **Cloudinary** by default. Set `STORAGE_PROVIDER=cloudinary` and your Cloudinary credentials in `backend/.env` (see `backend/.env.example`). Use `STORAGE_PROVIDER=local` only for offline dev without cloud storage.

## Production deployment

The API is a **normal long-running Express server** (`npm start` → `src/server.js`).  
Do **not** deploy the backend to Vercel serverless — it causes cold-start timeouts on list/detail routes.

### 1. Backend API (Render — recommended)

1. Push this repo to GitHub.
2. In [Render](https://render.com): **New → Blueprint** and select the repo (uses `render.yaml`),  
   **or** **New → Web Service** with **Root Directory** = `backend`, **Start Command** = `npm start`.
3. Set environment variables (from `backend/.env.example`):

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Strong random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | Different strong random string |
| `FRONTEND_URL` | Yes | `https://your-frontend.vercel.app` |
| `NODE_ENV` | Yes | `production` |
| `STORAGE_PROVIDER` | For uploads | `cloudinary` + Cloudinary credentials |
| `PAYMENTS_ENABLED` | Yes | `false` for staging |

4. After deploy, note the API URL (e.g. `https://pnmc-api.onrender.com`).

**Seed production database** (run once locally against Atlas):

```bash
MONGODB_URI="your-atlas-uri" npm run seed --prefix backend
```

### 2. Frontend (Vercel)

1. Import the repo in [Vercel](https://vercel.com) with **Root Directory** = `frontend`  
   (or use root `vercel.json` — frontend only, no serverless API).
2. Set build env vars before deploy:

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://pnmc-api.onrender.com/api` |

3. Redeploy the frontend after the API URL is live.

**Storage:** Use **Cloudinary** (`STORAGE_PROVIDER=cloudinary`) for documents and inspection media.

**Payments:** `PAYMENTS_ENABLED=false` auto-passes all payments (good for staging).

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
│   ├── src/
│   │   ├── config/          # App config, constants, database
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, RBAC, audit, rate limiting
│   │   ├── models/          # MongoDB schemas (20 models)
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (auth, payment, biometric, etc.)
│   │   ├── seeds/           # Database seed data
│   │   └── utils/           # Helpers
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Redux slices
│   │   ├── pages/           # Module pages & dashboards
│   │   ├── routes/          # React Router config
│   │   └── services/        # API clients
├── docs/                    # RBAC matrix, documentation
├── data/                    # Reference PDF forms
└── render.yaml              # Render deployment blueprint
```

## API Overview

All endpoints are prefixed with `/api/v1`. Authentication via JWT Bearer token.

Key endpoint groups:
- `/auth` — Login, register, refresh token
- `/institutions` — CRUD, applications, workflow
- `/students` — Registration, workflow, QR verification
- `/faculty` — Registration, workflow
- `/attendance` — Student & faculty attendance
- `/payments` — Payment creation, verification
- `/renewals` — Annual renewals
- `/inspections` — Field officer inspections
- `/affidavits` — Affidavit management
- `/committees` — Committee meetings, voting
- `/council` — Council meetings, resolutions
- `/biometric` — Device management, event ingestion
- `/monitoring` — Camera stream management
- `/documents` — File upload (MinIO/S3)
- `/dashboard/*` — Role-specific dashboards

## Reference Documents

The `data/` folder contains PNMC reference forms:
- Pre-Registration Application Form
- PNC Faculty Registration Form 2020
- PNC Institution Application Annual Return Form
- PNMC Letters Ordinance

Student and faculty registration forms in the frontend are modeled after these documents.

## Security

- JWT access tokens (15min) + refresh tokens (7 days)
- Role-based access control (10 roles, 40+ permissions)
- Rate limiting (100 req/15min API, 10 req/15min auth)
- Helmet security headers
- Audit logging with IP tracking
- Document encryption support

## License

Proprietary — Pakistan Nursing & Midwifery Council
# Pakistan-Nursing-Council
