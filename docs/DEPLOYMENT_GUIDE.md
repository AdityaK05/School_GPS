# Production Deployment Guide

This guide details the deployment of the School Transport Safety & Accountability Platform across all production target environments.

---

## Local Development: Supabase CLI + Docker Compose

The Compose stack runs the API, admin web app, and Traccar. Supabase (database, Auth, and PostGIS) runs separately through the Supabase CLI.

1. Install Docker Compose and the Supabase CLI. Start the local Supabase project and apply migrations:

   ```bash
   npx supabase start
   npx supabase db reset
   npx supabase status
   ```

2. Copy `.env.example` to `.env` and set values from the local Supabase status output:
   - `SUPABASE_URL=http://host.docker.internal:54321` for the API container.
   - `SUPABASE_SERVICE_ROLE_KEY` to the local service-role key. It is server-only and must not use a production key.
   - `VITE_SUPABASE_URL=http://localhost:54321` and `VITE_SUPABASE_ANON_KEY` to the local public/anon key for browser sign-in.
   - Generate unique local values for `GPS_INGEST_TOKEN` and `TRACCAR_DB_PASSWORD` (for example, with `openssl rand -hex 32`). Keep `.env` untracked.

3. Build and start the application:

   ```bash
   docker compose up --build
   ```

   The admin UI is available at `http://localhost:8080`; Traccar's management UI is bound to `http://localhost:8082`. The API is intentionally reachable through the admin web reverse proxy rather than a public host port. Traccar protocol ports are published for tracker devices; restrict them to trusted networks/firewall rules before connecting hardware.

4. Create an administrator in local Supabase Auth and provision the corresponding school/role profile using the project’s authorized setup workflow. The admin web login uses Supabase Auth; the API still resolves roles and tenant access server-side.

Do not use the example values or local Supabase credentials in a production deployment. Compose does not run Supabase itself, and local migrations must not be applied to a production project with `supabase db reset`.

The Expo parent/attendant UI is still a labeled demo and is disabled in non-development builds; do not distribute it to families or staff until authenticated workflows and hardware-backed scanning are implemented and tested.

---

## 1. Production Architecture Overview

- **Database / Auth / Realtime:** Supabase (PostgreSQL 17.11 with PostGIS, Row Level Security active on all 19 tables).
- **Backend API & Safety Engine:** Node.js 20 on Render (Web Service) or Container Host.
- **Admin Web Dashboard:** React + Vite on Vercel (Edge CDN).
- **Attendant & Parent Mobile Applications:** Expo prototype only; not approved for production distribution until the authenticated parent and hardware-backed attendant workflows are complete.

---

## 2. Production Supabase Setup & Migrations

- Select and configure the production Supabase project through the deployment operator's secure environment. Do not hardcode a project URL or credentials in the repository.
- Migrations 001–007 are located in `supabase/migrations/`:
  - `001_extensions_and_enums.sql`
  - `002_identity_and_tenants.sql`
  - `003_fleet_gps_rfid.sql`
  - `004_routes_stops_trips.sql`
  - `005_students_assignments_journey_events.sql`
  - `006_exceptions_notifications_audit.sql`
  - `007_rls_security_hardening.sql`
- Verify that every tenant-owned table has the expected constraints and Row Level Security policies after migrations are applied.

---

## 3. Backend Deployment (Render / Docker)

### Option A: Render Web Service
1. Connect repository to Render.
2. Render uses `render.yaml`:
   - Build: `npm install && npm run build`
   - Start: `npm run start:api`
   - Healthcheck: `/api/v1/health`
3. Configure Environment Variables in Render Dashboard:
   - `NODE_ENV=production`
   - `SUPABASE_URL=<production-supabase-project-url>`
   - `SUPABASE_SERVICE_ROLE_KEY=<secret>`
   - `FIREBASE_PROJECT_ID=<fcm-project-id>`
   - `FIREBASE_SERVER_KEY=<fcm-server-key>`

### Option B: Docker Container Deployment
```bash
docker build -t school-gps-api:latest .
docker run -d \
  --name school-gps-api \
  -p 3000:3000 \
  --env-file .env \
  --restart always \
  school-gps-api:latest
```

---

## 4. Admin Web Deployment (Vercel)

1. Connect repository root or `apps/admin-web` to Vercel.
2. Root Directory: `apps/admin-web`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Rewrite configuration in `apps/admin-web/vercel.json` proxies `/api/*` to the production backend.

---

## 5. Mobile Apps Build (Expo / EAS)

### Android Build
```bash
cd apps/mobile
npm install
npx eas build --platform android --profile production
```
Produces signed release APK for school attendant and parent devices.
