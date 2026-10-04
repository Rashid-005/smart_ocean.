# DEPLOYMENT

## Environment variables

| Key | Example | Notes |
|-----|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/smart_ocean?schema=public` | Required. Postgres 14+. PostGIS optional (schema is PostGIS-ready via `geomWkt`). |
| `ML_SERVICE_URL` | `http://localhost:8000` | Next.js → Python ML. Unset = DB fallback (`MVP_MOCK_v1`). |
| `ALLOW_INSECURE_COOKIES` | `0` | `1` only for local http. Production HTTPS keeps Secure cookies. |

See `.env.example`. Never commit `.env`.

## Database (PostgreSQL)

1. Create database: `CREATE DATABASE smart_ocean;`
2. Deploy schema: `npm run db:deploy` (`prisma migrate deploy`)
3. Seed demo data: `npm run db:seed` (zones A-D, demo fisherman, `MVP_MOCK_v1`, safety thresholds)
4. Verify: `psql -c "SELECT count(*) FROM fishing_zones;"`

## Next.js (Vercel)

1. Push repo, import in Vercel.
2. Set env: `DATABASE_URL`, `ML_SERVICE_URL`, `ALLOW_INSECURE_COOKIES=0`.
3. Build: `npm run build` (runs `prisma generate` first).
4. Run `prisma migrate deploy` + seed against the prod DB before first traffic.
5. Health: `GET /api/health` → `{ status: "ok", database: "ok" }`.

## ML service (Docker / Render / Fly)

- Local: `cd ml-service && pip install -r requirements.txt && uvicorn main:app --port 8000`
- Docker: `docker build -t smart-ocean-ml ./ml-service && docker run -p 8000:8000 smart-ocean-ml`
- Endpoints: `GET /health`, `GET /model/version` (`MVP_MOCK_v1`), `POST /predict`
- Point Next.js at it via `ML_SERVICE_URL`. Next.js falls back to DB if unreachable.
