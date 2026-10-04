# DEMO SCRIPT (5 minutes)

## Accounts

- Fisherman: `+255777123456` / `password123` (Unguja)
- Admin: `+255700000000` / `admin123`

## Journey

1. **Login** as fisherman → lands on Dashboard (location, safety SAFE, Zone A 87%).
2. **Smart Map** (`/map`): allow or deny GPS — demo location fallback near Unguja. Click Zone B/C/D, watch distance/ETA + route line update.
3. **Zones** (`/zones`): sorted by live GPS distance, species + best time from `MVP_MOCK_v1`.
4. **AI** (`/ai`): ask `Leo niende wapi?` → Zone A 87% Tuna/Sardines. Ask `Bahari iko salama?` → SAFE 12km/h. History persists in sidebar.
5. **Safety** (`/safety`): SAFE card + per-factor breakdown. Submit wind 30 → DANGEROUS, then reset to 12.
6. **Report** (`/reports`): auto-filled date/GPS/nearest zone/weather → submit `Tuna, 42kg` → `Saved report …`.
7. **History** (`/history`): new report on top → View Details (zone join + GPS stamp) → Delete.
8. **Admin** (`/admin`) as fisherman → 403. Login as admin → counts, zone activate/safe toggles, thresholds editor.

## Reset

- Safety: POST `/api/ocean-safety` with seed values (12, 0.8, 10, 27).
- Zones: ensure potentials A87/B64/C51/D39.
- `npm run db:seed` is idempotent for core demo rows.
