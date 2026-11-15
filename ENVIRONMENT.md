# Environment Variables Matrix

| Variable | Scope | Purpose | Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Backend | Runtime mode (`development`, `test`, `production`) | `production` |
| `PORT` | Backend | HTTP Port for API server | `3000` |
| `SUPABASE_URL` | Global | Remote Supabase project URL | `https://wsddukyzfpazndprbnsr.supabase.co` |
| `SUPABASE_ANON_KEY` | Client / Web | Public anon publishable key for client Realtime & Auth | `eyJhbGciOiJIUzI1NiIsIn...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend Only | Secret admin service key (strictly prohibited on clients) | `eyJhbGciOiJIUzI1NiIsIn...` |
| `FIREBASE_PROJECT_ID` | Backend | FCM HTTP v1 notification project identifier | `school-gps-prod` |
| `FIREBASE_SERVER_KEY` | Backend | FCM cloud messaging key for push delivery | `AAAABbbb...` |
| `FCM_DRY_RUN` | Backend | Dispatches notification in dry-run mode when true | `false` |
| `GPS_FRESHNESS_SECONDS` | Config | Max staleness window before `GPS_UNAVAILABLE` (default: 60) | `60` |
| `EXIT_MISSING_GRACE_MINUTES`| Config | Grace window after stop arrival before `EXIT_MISSING` (default: 5) | `5` |
