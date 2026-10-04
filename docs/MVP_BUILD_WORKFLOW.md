# MVP BUILD WORKFLOW

**CRITICAL RULE:** This is a strict gated implementation workflow. The project must be built one phase at a time. NEVER automatically move to the next phase without explicit user approval.

## Phase 0 — Documentation and Source of Truth
- **Objectives:** Establish project structure and documentation.
- **Tasks:** Create `docs/` folder, define architecture, workflow, build vs mock boundaries, API contracts, and README.
- **Gate:** Request approval. Proceed on "APPROVED — CONTINUE".

## Phase 1 — Frontend
- **Objectives:** Build the complete frontend user experience (no real backend/DB).
- **Tasks:** Language selection, Auth UI, application shell, Navigation, Dashboard, Smart Map UI, Zones UI, AI Assistant UI, Ocean Safety UI, Report UI, History UI, Settings, Admin structure, responsive states. Use local/mock state.
- **Gate:** Verify UI works seamlessly. Request approval.

## Phase 2 — Backend/API
- **Objectives:** Build the Next.js business logic and API routes using temporary storage (no DB yet).
- **Tasks:** Authentication logic, authorization, validation (Zod), service layer, provider interfaces, temporary in-memory repositories.
- **Gate:** Verify API responds and auth flows work with mock storage. Request approval.

## Phase 3 — Database
- **Objectives:** Replace temporary storage with PostgreSQL and Prisma.
- **Tasks:** Setup Prisma schema, migrations, relationships, PostGIS prep, seed data (Unguja/Pemba zones).
- **Gate:** Verify database connection, successful migrations, and seeded data. Request approval.

## Phase 4 — Frontend + Backend + Database Integration
- **Objectives:** Connect Frontend to real Backend APIs and PostgreSQL.
- **Tasks:** Wire up login, dashboard, zones, reports, history, profile, and admin to use real API calls.
- **Gate:** Verify the full basic CRUD flows and authentication via real DB. Request approval.

## Phase 5 — GPS + Smart Fishing Map + Distance + ETA + Routing
- **Objectives:** Implement actual location and map functionality.
- **Tasks:** Browser GPS, location permissions, distance/ETA calculation, interactive map with markers, dynamic route generation, demo location fallback.
- **Gate:** Verify map interactions, GPS updates, and routing changes. Request approval.

## Phase 6 — Python/FastAPI ML Service
- **Objectives:** Connect the independent ML prediction service.
- **Tasks:** Create FastAPI service, predict/health endpoints, prediction service connection in Next.js, return controlled MVP predictions.
- **Gate:** Verify frontend receives and displays predictions from the Python service. Request approval.

## Phase 7 — Ocean Safety
- **Objectives:** Implement actual safety logic rules.
- **Tasks:** Safety data model, environmental inputs, rule thresholds (Safe/Moderate/Dangerous), backend endpoint, UI integration.
- **Gate:** Verify safety logic computes correctly based on inputs. Request approval.

## Phase 8 — AI Assistant
- **Objectives:** Build a grounded conversational AI.
- **Tasks:** Chat UI, conversation history, context construction from trusted application data, prompt/data injection protection.
- **Gate:** Verify AI answers core questions accurately based on app data, without hallucination. Request approval.

## Phase 9 — Fishing Report + History
- **Objectives:** Complete the data collection loop.
- **Tasks:** Report form, auto-filling (GPS, zone, weather), validation, persistence, view saved trip history and details.
- **Gate:** Verify report creation and retrieval work end-to-end. Request approval.

## Phase 10 — Admin + Security
- **Objectives:** Harden the application and finalize admin capabilities.
- **Tasks:** Admin authorization, management of zones/species/demo data, RBAC, secure cookies, input validation, rate limiting.
- **Gate:** Verify regular users cannot access admin; test security validations. Request approval.

## Phase 11 — End-to-End Testing
- **Objectives:** Validate the complete "Sahara Spark" demonstration journey.
- **Tasks:** Run the full primary user journey, verify responsive design, error states, and handling of offline/unavailable services. Fix all critical bugs.
- **Gate:** Verify the entire product flow works flawlessly. Request approval.

## Phase 12 — Final Deployment and Demo Preparation
- **Objectives:** Package and deploy the MVP.
- **Tasks:** Production config, environment variables, Vercel deployment (Next.js), Python service deployment, DB deployment, setup instructions.
- **Gate:** Final verification. Project completion.
