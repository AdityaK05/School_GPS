# Production Deployment Guide

This guide details the deployment of the School Transport Safety & Accountability Platform across all production target environments.

---

## 1. Production Architecture Overview

- **Database / Auth / Realtime:** Supabase (PostgreSQL 17.11 with PostGIS, Row Level Security active on all 19 tables).
- **Backend API & Safety Engine:** Node.js 20 on Render (Web Service) or Container Host.
- **Admin Web Dashboard:** React + Vite on Vercel (Edge CDN).
- **Attendant & Parent Mobile Applications:** React Native / Expo distributed via EAS (Android APK/AAB).

---

## 2. Remote Supabase Setup & Migrations

- Target Project: `wsddukyzfpazndprbnsr` (`ap-south-1`).
- Migrations 001–007 are located in `supabase/migrations/`:
  - `001_extensions_and_enums.sql`
  - `002_identity_and_tenants.sql`
  - `003_fleet_gps_rfid.sql`
  - `004_routes_stops_trips.sql`
  - `005_students_assignments_journey_events.sql`
  - `006_exceptions_notifications_audit.sql`
  - `007_rls_security_hardening.sql`
- All 19 tables have Row Level Security enabled (`rls_enabled: true`).

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
   - `SUPABASE_URL=https://wsddukyzfpazndprbnsr.supabase.co`
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
