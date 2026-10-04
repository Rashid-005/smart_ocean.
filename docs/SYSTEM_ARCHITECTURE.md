# SYSTEM ARCHITECTURE

## 1. Project Overview & Scope
**Name:** SMART OCEAN
**Target Geographic Scope:** Zanzibar (Unguja and Pemba only for MVP).
**Core Product Loop:** Predict → Recommend → Navigate → Fish → Report → Learn → Predict again.
**Architecture Style:** Modular monolith for Next.js + one independent ML service.

## 2. Technology Stack
- **Frontend / Application:** Next.js, TypeScript, React, App Router.
- **UI:** Tailwind CSS with reusable components.
- **Database:** PostgreSQL.
- **ORM:** Prisma.
- **Spatial Readiness:** PostGIS-compatible schema and spatial architecture.
- **ML Service:** Python + FastAPI (independent service).
- **Validation:** Zod.

## 3. Core System Components

### Frontend (Next.js)
- Responsive, mobile-first web application.
- **Language Support:** English and Kiswahili (persisted in user profile).
- **Navigation:** Sidebar on desktop, drawer on mobile (Dashboard, Smart Map, Zones, AI, Safety, Report, History, Profile, Settings, Admin).

### Database (PostgreSQL + Prisma)
- Relational structure with PostGIS readiness.
- Core Entities: users, fishermen, fishing_zones, zone_predictions, ocean_conditions, weather_data, fishing_reports, fishing_report_species, locations, ai_conversations, ai_messages, notifications, roles, system_settings, audit_logs, ml_models.

### Backend (Next.js API Routes)
- Business logic decoupled from storage using repository abstractions.
- Secure session-based authentication.

### Python ML Service
- Independent API providing predictions.
- For the MVP, returns controlled/mock predictions through stable API contracts.

### External Providers Abstraction
Providers must be hidden behind abstraction interfaces:
- `MapService` → `MapProvider`
- `RoutingService` → `RoutingProvider`
- `WeatherService` → `WeatherProvider`
- `OceanService` → `OceanDataProvider`
- `PredictionService` → `PythonMLProvider` / `MockPredictionProvider`
- `AIService` → `AIProvider`

## 4. Key Feature Architectures

### Smart Fishing Map & GPS
- Uses browser Geolocation API.
- Calculates distance and ETA to zones.
- Interactive map showing current location, zones (A/B/C/D), and routing.
- Dynamic route switching on zone selection.
- Controlled fallback for MVP if GPS is unavailable.

### Ocean Safety Engine
- Consumes environmental data (wind, waves, weather).
- Applies safety rules to output status: SAFE, MODERATE / CAUTION, DANGEROUS.
- Status is determined by application logic, not guessed by AI.

### AI Assistant
- Grounded on trusted system data (location, zones, predictions, safety).
- Retrieves context via orchestrator before passing to the AI model.
- Prevents prompt injection and hallucination of data.

### Fishing Report & History
- Captures trip details (catch, fuel, species) and auto-fills (date, GPS, zone, environment).
- Acts as the data collection loop for future ML training.

## 5. Security & Admin
- **Security:** Password hashing, protected routes, secure cookies, SQL/XSS protection, rate limiting, RBAC, environment secrets.
- **Admin:** Basic management of users, zones, species, demo data, and safety config.
