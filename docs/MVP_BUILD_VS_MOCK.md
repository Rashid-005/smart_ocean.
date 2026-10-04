# MVP BUILD VS MOCK BOUNDARIES

The product behavior must be real even when some data is mocked. The application must operate like a real product rather than a collection of static screens.

## MUST BE BUILT FOR REAL
These capabilities must be genuinely implemented and functioning:
- **Frontend & Navigation:** Complete UI shell, language selection, routing, responsiveness.
- **Backend & Database:** Next.js APIs, PostgreSQL persistence, Prisma schema, auth, authorization, RBAC, protected routes.
- **Mapping & Location:** Browser GPS integration, interactive map component, zone selection, actual distance and ETA calculations, dynamic route behavior on the map.
- **Core Workflows:** Dashboard composition, Fishing Report submission and validation, History retrieval, Admin management structure.
- **AI & Safety:** Real AI chat interface and backend, trusted-data retrieval and context injection, Ocean Safety rules logic layer.
- **Services:** Real communication between Next.js and the Python ML API service.
- **Security:** Password hashing, protected sessions, input validation, essential security controls.

## MAY BE MOCKED / SEEDED
The following data can use deterministic, seeded, or controlled values for the MVP demonstration (provided they pass through the real architectural pathways):
- **ML Predictions:** Prediction scores, expected fish species, recommended times, prediction confidence.
- **Environment:** Weather data, ocean measurements (wind, waves, temperature), safety inputs.
- **Geography:** Demonstration fishing zones (Zone A/B/C/D in Unguja and Pemba).
- **Other:** Notification content, fallback routing data (if live routing fails or is unavailable).

## ABSTRACTION REQUIREMENT
Mock implementations must live behind service/provider interfaces (e.g., `MockPredictionProvider`, `DemoRoutingProvider`). This ensures they can be replaced by real providers later without rewriting the UI or business logic.

## NEVER CLAIM MOCK DATA IS REAL
Do not falsely present seeded or demo information as:
- Scientifically validated predictions.
- Real-time marine intelligence or live weather.
- Guaranteed marine safety.
- Production offshore navigation.
Use internal source labels (MOCK, SEEDED, LIVE, ML_MODEL) where useful to clarify data origins.
