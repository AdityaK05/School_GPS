# Environment Variables Matrix

| Variable | Scope | Purpose | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Backend | Runtime mode (`development`, `test`, `production`) | `production` |
| `PORT` | Backend | HTTP port for API server | `3000` |
| `SUPABASE_URL` | Backend only | Supabase API URL reachable from the API runtime | `http://host.docker.internal:54321` (local Compose) |
| `VITE_SUPABASE_URL` | Admin web build | Supabase Auth URL reachable from the browser | `http://localhost:54321` (local Compose) |
| `VITE_SUPABASE_ANON_KEY` | Admin web build | Public Supabase publishable/anon key; never use a service-role key | Supplied by the selected Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | Secret admin service key; strictly prohibited on clients | Store as a secret environment variable |
| `GPS_INGEST_TOKEN` | Backend and Traccar | Shared authentication token for trusted GPS ingestion | Generate a unique secret |
| `TRACCAR_DB_PASSWORD` | Traccar | Password for the private Traccar PostgreSQL database | Generate a unique secret |
| `FIREBASE_PROJECT_ID` | Backend | FCM HTTP v1 notification project identifier | Supplied by the selected FCM project |
| `FIREBASE_SERVER_KEY` | Backend | FCM credential/private key for push delivery | Store as a secret environment variable |
| `FCM_DRY_RUN` | Backend | Dispatches notifications in dry-run mode when true | `true` |
| `AI_ENABLED` | Backend | Enables optional, non-safety AI support tooling | `false` |
| `GPS_FRESHNESS_SECONDS` | Configuration | Maximum staleness window before `GPS_UNAVAILABLE` (default: 60) | `60` |
| `EXIT_MISSING_GRACE_MINUTES` | Configuration | Grace window after stop arrival before `EXIT_MISSING` (default: 5) | `5` |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile build | API base URL reachable from the mobile device or emulator | `http://localhost:8080` (local host/emulator) |
