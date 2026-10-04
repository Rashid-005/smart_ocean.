# SMART OCEAN (Zanzibar MVP: Unguja + Pemba)

Predict → Recommend → Navigate → Fish → Report → Learn → Predict again.

## Stack

Next.js 14 + TypeScript + Tailwind, PostgreSQL + Prisma (PostGIS-ready),
Python FastAPI ML service (`MVP_MOCK_v1` controlled predictions), Zod, Leaflet (OSM).

## Quick start

```bash
npm install
cp .env.example .env   # set DATABASE_URL, ML_SERVICE_URL
npm run db:migrate     # local dev migration
npm run db:seed        # demo user, zones A-D, predictions, safety config
npm run dev            # http://localhost:3000
```

ML service (optional, DB fallback otherwise):

```bash
cd ml-service && pip install -r requirements.txt && uvicorn main:app --port 8000
```

## Demo accounts

- Fisherman `+255777123456` / `password123`
- Admin `+255700000000` / `admin123`

See `docs/DEMO.md` for the 5-minute journey.

## Docs

- `docs/SYSTEM_ARCHITECTURE.md`, `docs/API_CONTRACTS.md`
- `docs/MVP_BUILD_WORKFLOW.md` (phases 0–12), `docs/MVP_BUILD_VS_MOCK.md`
- `docs/DEPLOYMENT.md`, `docs/DEMO.md`

## Production

```bash
npm run db:deploy
npm run build
npm start
```

Health: `GET /api/health`. Mock data is labeled `MOCK`/`ML_MODEL`, never presented as live science.
