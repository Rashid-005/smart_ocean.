"""SMART OCEAN ML Service (MVP).

Independent FastAPI service. For the MVP it returns controlled,
deterministic predictions through stable API contracts
(API_CONTRACTS.md: POST /predict, GET /health, GET /model/version).

Run:  uvicorn main:app --port 8000
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

MODEL_VERSION = "MVP_MOCK_v1"

app = FastAPI(title="Smart Ocean ML Service", version="0.1.0")


class PredictRequest(BaseModel):
    zoneId: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    windSpeedKmh: Optional[float] = None
    waveHeightM: Optional[float] = None
    temperatureC: Optional[float] = None


class PredictionResponse(BaseModel):
    zoneId: str
    potential: int = Field(ge=0, le=100)
    confidence: str
    species: List[str]
    recommendedTime: str
    modelVersion: str = MODEL_VERSION
    generatedAt: str


# Controlled MVP predictions (mirrors prisma/seed.ts zones A-D).
ZONE_PRESETS = {
    "zone-a": {
        "zoneId": "zone-a",
        "potential": 87,
        "confidence": "High",
        "species": ["Tuna", "Sardines"],
        "recommendedTime": "06:00 - 10:00",
    },
    "zone-b": {
        "zoneId": "zone-b",
        "potential": 64,
        "confidence": "Medium",
        "species": ["Kingfish"],
        "recommendedTime": "05:30 - 09:30",
    },
    "zone-c": {
        "zoneId": "zone-c",
        "potential": 51,
        "confidence": "Low",
        "species": ["Snapper"],
        "recommendedTime": "16:00 - 19:00",
    },
    "zone-d": {
        "zoneId": "zone-d",
        "potential": 39,
        "confidence": "Low",
        "species": ["Mackerel"],
        "recommendedTime": "07:00 - 11:00",
    },
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/health")
def health():
    return {"status": "ok", "modelVersion": MODEL_VERSION, "service": "smart-ocean-ml"}


@app.get("/model/version")
def model_version():
    return {"modelVersion": MODEL_VERSION}


@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictRequest):
    raw = (req.zoneId or "").strip().lower().replace("_", "-").replace(" ", "-")
    # Accept "Zone A", "zone a", "zonea", "a", "zone-a" → "zone-a".
    compact = raw.replace("-", "")
    alias = {
        "zonea": "zone-a",
        "a": "zone-a",
        "zoneb": "zone-b",
        "b": "zone-b",
        "zonec": "zone-c",
        "c": "zone-c",
        "zoned": "zone-d",
        "d": "zone-d",
    }
    key = alias.get(compact, raw)
    if key in ZONE_PRESETS:
        preset = ZONE_PRESETS[key]
        return {**preset, "modelVersion": MODEL_VERSION, "generatedAt": _now()}

    # Generic deterministic fallback for unknown zones/coords.
    # Downgrade potential in rough conditions (safety-aware, not a safety verdict).
    potential = 55
    if req.windSpeedKmh is not None and req.windSpeedKmh > 20:
        potential -= 15
    if req.waveHeightM is not None and req.waveHeightM > 1.5:
        potential -= 10
    potential = max(5, min(95, potential))

    return {
        "zoneId": req.zoneId or "unknown",
        "potential": potential,
        "confidence": "Medium" if potential >= 50 else "Low",
        "species": ["Mixed reef fish"],
        "recommendedTime": "06:00 - 10:00",
        "modelVersion": MODEL_VERSION,
        "generatedAt": _now(),
    }
