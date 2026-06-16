# PNMC Management System

Enterprise-grade Nursing & Midwifery Council Management System built with the MERN stack.

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Redux Toolkit, Material UI, React Query, React Hook Form, Socket.io, Chart.js, React Router |
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.io, JWT, RBAC |
| Storage | AWS S3 / MinIO |
| Deployment | Docker, Nginx, Vercel, GitHub Actions CI/CD |

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
12. **Real-Time Monitoring** — Camera streams, snapshots, Socket.io events
13. **Payment Module** — Stripe, Easypaisa, JazzCash abstraction
14. **Notification System** — Email, SMS, WhatsApp, In-App
15. **Audit System** — Full action tracking with IP logging

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Docker & Docker Compose (optional)

### Local Development

```bash
# Copy environment file
cp .env.example .env

# Install dependencies
npm run install:all

# Start MongoDB (or use Docker)
docker-compose up -d mongodb minio redis

# Seed database
npm run seed

# Start dev servers
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger Docs: http://localhost:5000/api/docs
- MinIO Console: http://localhost:9001

### Docker (Full Stack)

```bash
docker-compose up -d
```

Access via http://localhost (Nginx reverse proxy)

### Vercel Deployment

The repo includes `vercel.json` for full-stack deploy (React frontend + Express API as serverless).

**1. Push to GitHub and import the repo in [Vercel](https://vercel.com).**

**2. Add environment variables** from `vercel.env.example` in  
   **Project → Settings → Environment Variables**.

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Strong random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | Different strong random string |
| `FRONTEND_URL` | Yes | `https://your-project.vercel.app` or custom domain |
| `NODE_ENV` | Yes | `production` |
| `VITE_API_URL` | Yes | `/api/v1` (same deployment) |
| `STORAGE_PROVIDER` | Yes | `s3` on Vercel |
| `AWS_ACCESS_KEY_ID` | Yes* | *Required if using S3 |
| `AWS_SECRET_ACCESS_KEY` | Yes* | |
| `AWS_REGION` | Yes* | e.g. `us-east-1` |
| `AWS_S3_BUCKET` | Yes* | Your S3 bucket name |
| `VITE_SOCKET_URL` | No | Leave empty on Vercel (WebSockets need a separate host) |

**3. Deploy.** Vercel runs:
- `frontend` build → static site
- `api/index.js` → serverless Express API at `/api/*`

**4. Seed production database** (run once locally against Atlas):

```bash
MONGODB_URI="your-atlas-uri" npm run seed --prefix backend
```

**Notes:**
- Use **MongoDB Atlas** — local MongoDB does not work on Vercel.
- Use **AWS S3** for file storage — MinIO localhost is not available.
- **Socket.io / live monitoring** requires a separate Node server (Railway, Render, etc.); set `VITE_SOCKET_URL` to that URL.
- Swagger docs: `https://your-app.vercel.app/api/docs`

## Default Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@pnmc.gov.pk | Admin@123 |
| Council Member | council@pnmc.gov.pk | Council@123 |
| Committee Member | committee@pnmc.gov.pk | Committee@123 |
| Field Officer | field@pnmc.gov.pk | Field@123 |
| Finance Officer | finance@pnmc.gov.pk | Finance@123 |
| Monitoring Officer | monitoring@pnmc.gov.pk | Monitor@123 |
| Institution Admin | institution@pins.edu.pk | Inst@123 |
| Student | student@pins.edu.pk | Student@123 |
| Faculty | faculty@pins.edu.pk | Faculty@123 |

## Project Structure

```
PNC/
├── backend/
│   ├── src/
│   │   ├── config/          # App config, constants, swagger, database
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, RBAC, audit, rate limiting
│   │   ├── models/          # MongoDB schemas (20 models)
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (auth, payment, biometric, etc.)
│   │   ├── socket/          # Socket.io real-time events
│   │   ├── seeds/           # Database seed data
│   │   └── utils/           # Helpers
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Redux slices
│   │   ├── pages/           # Module pages & dashboards
│   │   ├── routes/          # React Router config
│   │   └── services/        # API & Socket clients
│   └── Dockerfile
├── docker/                  # Nginx config
├── docs/                    # RBAC matrix, documentation
├── data/                    # Reference PDF forms
└── docker-compose.yml
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
# Pakistan-Nu[Drsing-Council
