# Production Deployment Guide
**School Transport Safety & Accountability Platform**

This guide provides end-to-end instructions for deploying the backend services, web applications, mobile builds, database migrations, and device telematics gateways to a production environment.

---

## 1. Architecture Topology

```
[ GPS Telematics Gateway / Webhooks ]   [ Mobile Attendant Devices ]   [ Parent & Admin Browsers ]
                 │                                    │                            │
                 ▼                                    ▼                            ▼
         ┌──────────────────────────────────────────────────────────────────────────────┐
         │                       Cloud Load Balancer / Reverse Proxy                     │
         └──────────────────────────────────────┬───────────────────────────────────────┘
                                                │ HTTPS
                                                ▼
         ┌──────────────────────────────────────────────────────────────────────────────┐
         │                    Node.js / Express Core Safety Engine API                   │
         │                  (apps/api - Stateless Container Cluster)                    │
         └──────────────────────┬───────────────────────────────┬───────────────────────┘
                                │                               │
                     Real-time  │                      Pooler   │ PostgreSQL / PostGIS
                     WebSockets ▼                               ▼
         ┌───────────────────────────────┐              ┌───────────────────────────────┐
         │   Supabase Realtime Channel   │              │   Supabase Database Cluster   │
         │   (Broadcast / Presence)      │              │   (PostGIS, RLS, Audit Logs)  │
         └───────────────────────────────┘              └───────────────────────────────┘
```

---

## 2. Environment Variables & Secret Classification

All production variables must be configured in your container runtime (e.g. AWS ECS, GCP Cloud Run, or Kubernetes) and never bundled in public artifacts.

| Variable | Scope | Description | Example / Format |
| :--- | :--- | :--- | :--- |
| `PORT` | `SERVER_ONLY` | HTTP server listening port | `3000` |
| `NODE_ENV` | `SERVER_ONLY` | Node execution environment | `production` |
| `LOG_LEVEL` | `SERVER_ONLY` | Structured log severity | `INFO` (or `WARN`) |
| `CORS_ORIGIN` | `SERVER_ONLY` | Allowed client origins | `https://admin.schoolgps.com` |
| `SUPABASE_URL` | `PUBLIC` | Supabase project endpoint | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | `PUBLIC` | Supabase client publishable key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVER_ONLY` | Backend admin key (NEVER in client) | `eyJhbGciOi...` |
| `GPS_VENDOR_WEBHOOK_SECRET` | `SERVER_ONLY` | Shared HMAC secret for GPS adapter | High-entropy string |
| `FCM_PROJECT_ID` | `SERVER_ONLY` | Firebase push notification project | `school-gps-prod` |
| `FCM_CLIENT_EMAIL` | `SERVER_ONLY` | Google Service Account email | `sa@proj.iam.gserviceaccount.com`|
| `FCM_PRIVATE_KEY` | `SERVER_ONLY` | RSA private key for FCM | `"-----BEGIN PRIVATE KEY...-----"`|

---

## 3. Database Migration Deployment Order

Execute migrations sequentially using the Supabase CLI or CI/CD deployment pipeline:

```bash
# Verify connection to remote Supabase project
npx supabase link --project-ref <PRODUCTION_PROJECT_REF>

# Apply migrations in deterministic sequence 001 through 007:
# 1. 20261115000001_extensions_and_enums.sql       (PostGIS, uuid-ossp, enums)
# 2. 20261115000002_identity_and_tenants.sql       (Schools, users, user_schools)
# 3. 20261115000003_fleet_gps_rfid.sql             (Buses, gps_devices, rfid_devices, gps_locations)
# 4. 20261115000004_routes_stops_trips.sql         (Routes, stops, trips, trip_students)
# 5. 20261115000005_students_assignments_journey.sql (Students, assignments, journey_events)
# 6. 20261115000006_exceptions_notifications_audit.sql (Exceptions, notifications, audit_logs)
# 7. 20261115000007_rls_security_hardening.sql     (Row Level Security policies & tenant isolation)
npx supabase db push
```

---

## 4. Backend Service Deployment

1. **Build Step**:
   ```bash
   npm install --ignore-scripts
   npm run build
   ```
2. **Containerization (Dockerfile)**:
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json tsconfig.json ./
   COPY packages/ ./packages/
   COPY apps/api/ ./apps/api/
   RUN npm install --ignore-scripts
   RUN npx tsc --noEmit

   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   COPY --from=builder /app ./
   EXPOSE 3000
   CMD ["node", "apps/api/dist/index.js"]
   ```
3. **Health Check Probes**:
   - Liveness Probe: `GET /api/v1/health` (HTTP 200 `{"status":"HEALTHY"}`)
   - Readiness Probe: `GET /api/v1/ready` (HTTP 200 `{"ready":true}`)

---

## 5. Web Admin Dashboard Deployment

1. The Admin Web dashboard is built as a static Single Page Application (SPA):
   ```bash
   cd apps/admin-web
   npm run build
   ```
2. Deploy the generated output to an S3 bucket with CloudFront distribution, Vercel, or Netlify with strict HTTPS enforcement and HSTS headers.

---

## 6. Mobile Application Deployment (Android / iOS)

1. **Attendant App (`apps/mobile`)**:
   - Production target: Ruggedized onboard Android tablets or dedicated attendant devices.
   - Requires SQLite local database driver (`expo-sqlite` or `@capacitor-community/sqlite`).
   - Hardware requirements: 13.56 MHz NFC / ISO/IEC 14443 contactless reader or USB HID reader.
2. **Parent App (`apps/mobile`)**:
   - Distributed via Google Play Store and Apple App Store.
   - Enforces read-only student visibility using Supabase Auth JWTs.

---

## 7. Rollback Procedures

1. **Backend API Rollback**:
   - Redeploy the previous immutable container image tag. Stateless design ensures immediate zero-downtime traffic switch.
2. **Database Rollback**:
   - Database schema uses backward-compatible migrations with additive columns and non-breaking constraints.
   - Never run destructive down-migrations without taking a full Point-In-Time-Recovery (PITR) snapshot first.
