# API CONTRACTS

These represent the internal and external API boundaries for the Next.js backend and the Python ML service. All protected endpoints must validate authentication, authorization, ownership, and inputs.

## Authentication
- `POST /api/auth/register` - Register new fisherman/admin.
- `POST /api/auth/login` - Authenticate and create secure session.
- `POST /api/auth/logout` - Destroy session.

## User
- `GET /api/user/profile` - Retrieve logged-in user details (including language preference).
- `PATCH /api/user/profile` - Update user profile.

## Location & Maps
- `GET /api/location` - Retrieve current/demo location.

## Fishing Zones
- `GET /api/fishing-zones` - List all fishing zones.
- `GET /api/fishing-zones/nearby` - List zones sorted by distance to current GPS.
- `GET /api/fishing-zones/:id` - Get specific zone details.

## Predictions (Next.js Orchestration)
- `GET /api/predictions` - List predictions for zones.
- `GET /api/predictions/nearby` - List predictions relevant to nearby zones.
- `GET /api/predictions/:zoneId` - Get specific prediction details for a zone.

## Ocean Safety & Weather
- `GET /api/ocean-safety` - Retrieve calculated safety status (SAFE, MODERATE/CAUTION, DANGEROUS).
- `GET /api/weather` - Retrieve weather/environmental data.

## Fishing Reports
- `POST /api/fishing-reports` - Submit a new fishing report.
- `GET /api/fishing-reports` - List user's historical reports.
- `GET /api/fishing-reports/:id` - View single report details.
- `PATCH /api/fishing-reports/:id` - Edit report.
- `DELETE /api/fishing-reports/:id` - Delete report.

## AI Assistant
- `POST /api/ai/chat` - Send message and context to AI, receive grounded response.
- `GET /api/ai/conversations` - List user's AI conversations.
- `GET /api/ai/conversations/:id` - Retrieve specific conversation history.

## Python ML Service (Independent API)
- `POST /predict` - Accepts environmental/historical data, returns fishing potential, species, and recommended time.
- `GET /health` - Service health check.
- `GET /model/version` - Current active model version (e.g., MVP_MOCK_v1).
