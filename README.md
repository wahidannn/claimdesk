# ClaimDesk

ClaimDesk adalah aplikasi fullstack untuk expense approval dan reimbursement. Repository ini memakai struktur monorepo sederhana dengan backend Spring Boot, frontend React, dan PostgreSQL lokal lewat Docker Compose.

## Struktur Project

```text
claimdesk/
|-- backend/
|-- frontend/
|-- docker-compose.yml
|-- .env.example
|-- README.md
`-- plan.md
```

## Prasyarat

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker Desktop

## Menjalankan Lokal

Start database:

```bash
docker compose up -d
```

Start backend:

```bash
cd backend
./mvnw spring-boot:run
```

Di PowerShell Windows, gunakan:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Start frontend:

```bash
cd frontend
npm install
npm run dev
```

## URL Lokal

- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/api/health
- Swagger UI: http://localhost:8080/swagger-ui/index.html

## Authentication Demo

Login tersedia di endpoint `POST /api/auth/login`. Backend mengirim JWT sebagai cookie HttpOnly bernama `access_token`, sehingga frontend tidak perlu menyimpan token di `localStorage`.

Demo account:

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@example.com` | `password123` |
| EMPLOYEE | `employee@example.com` | `password123` |
| MANAGER | `manager@example.com` | `password123` |
| FINANCE | `finance@example.com` | `password123` |

Endpoint auth:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Environment

Salin nilai dari `.env.example` sesuai kebutuhan. Backend membaca konfigurasi database dari environment variable, sedangkan frontend memakai `VITE_API_BASE_URL`.

## Receipt Storage

Secara default receipt disimpan secara lokal di `backend/storage/receipts` lewat:

```text
APP_STORAGE_PROVIDER=local
RECEIPTS_DIR=storage/receipts
```

Untuk production, backend bisa memakai Supabase Storage. Buat bucket private bernama `receipts`, lalu set environment backend:

```text
APP_STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
SUPABASE_SIGNED_URL_TTL_SECONDS=300
```

Service role key hanya disimpan di backend environment. Frontend tetap upload, view, dan delete receipt lewat endpoint ClaimDesk yang sama.

## Production Deployment

### Backend Render

Backend disiapkan dengan `backend/Dockerfile` dan profile production `prod`.

Deploy backend ke Render:

1. Buat `Web Service`.
2. Connect ke repository GitHub ClaimDesk.
3. Pilih environment `Docker`.
4. Set root directory ke `backend`.
5. Gunakan Dockerfile path `Dockerfile`.
6. Set health check path ke `/api/health`.

Minimal env Render backend:

```text
SPRING_PROFILES_ACTIVE=prod
PORT=8080
DATABASE_URL=jdbc:postgresql://supabase-db-host:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=supabase-database-password
JWT_SECRET=replace-with-random-secret-at-least-32-characters
JWT_EXPIRATION_MS=86400000
FRONTEND_ORIGIN=https://frontend-domain
COOKIE_SECURE=true
COOKIE_SAME_SITE=None
APP_STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=receipts
SUPABASE_SIGNED_URL_TTL_SECONDS=300
OPENAPI_ENABLED=false
JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75
```

Render health check:

```text
/api/health
```

Flyway migration berjalan otomatis saat backend Render start pertama kali.

### Supabase Database

Gunakan Supabase PostgreSQL sebagai database production. Ambil connection string dari:

```text
Supabase Dashboard > Project Settings > Database > Connection string > JDBC
```

Pastikan `DATABASE_URL` berbentuk JDBC dan memakai SSL:

```text
jdbc:postgresql://supabase-db-host:5432/postgres?sslmode=require
```

Jika memakai Supabase pooler, pakai host dan port dari connection string Supabase. Isi `DB_USERNAME` dan `DB_PASSWORD` sesuai credential database Supabase.

### Supabase Storage

Untuk receipt production:

- Buat bucket private bernama `receipts`.
- Set `APP_STORAGE_PROVIDER=supabase`.
- Simpan `SUPABASE_SERVICE_ROLE_KEY` hanya di backend Render.
- Jangan pernah memasukkan service role key ke frontend.

### Frontend Production

Frontend bisa dideploy ke Vercel, Netlify, atau static hosting lain.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Production env frontend:

```text
VITE_API_BASE_URL=https://backend-render-url.onrender.com/api
```

SPA fallback sudah disiapkan lewat:

- `frontend/vercel.json`
- `frontend/netlify.toml`

Jika frontend ada di domain berbeda dari backend Render, pastikan env backend:

```text
FRONTEND_ORIGIN=https://frontend-domain
COOKIE_SECURE=true
COOKIE_SAME_SITE=None
```

### Production Checklist

- `GET https://backend-render-url.onrender.com/api/health` return `200`.
- Frontend production memakai `VITE_API_BASE_URL=https://backend-render-url.onrender.com/api`.
- `FRONTEND_ORIGIN` sama persis dengan domain frontend.
- Cookie `access_token` muncul sebagai HttpOnly dan Secure setelah login.
- Jika frontend/backend beda domain, gunakan `COOKIE_SECURE=true` dan `COOKIE_SAME_SITE=None`.
- Upload receipt masuk ke Supabase bucket `receipts`.
- View dan delete receipt berjalan.
- Report CSV bisa didownload.
- Jangan simpan `SUPABASE_SERVICE_ROLE_KEY` atau `JWT_SECRET` di frontend.

### Production Troubleshooting

- Login sukses tapi `/api/auth/me` masih `401`: cek `FRONTEND_ORIGIN`, `COOKIE_SECURE=true`, dan `COOKIE_SAME_SITE=None`.
- Browser menampilkan CORS error: pastikan `FRONTEND_ORIGIN` sama persis dengan domain frontend, termasuk `https://`.
- Backend gagal connect database: cek `DATABASE_URL` harus JDBC dan tambahkan `sslmode=require`.
- Upload receipt gagal: pastikan `SUPABASE_SERVICE_ROLE_KEY` adalah JWT service role, bukan anon key.
- Request pertama lambat: normal di Render Free karena service bisa sleep saat tidak ada traffic.
