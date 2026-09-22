from __future__ import annotations

import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.inference import model
from app.schema import AssessRequest, AssessResponse, ModelInfoResponse
from app.ultrasound import (
    ALLOWED_CONTENT_TYPES,
    MAX_UPLOAD_BYTES,
    UltrasoundModelUnavailable,
    ultrasound_model,
)

app = FastAPI(
    title="PCOS Screening ML Service",
    description=(
        "Explainable, uncertainty-aware PCOS risk *screening* — not a "
        "diagnostic API. See /model-info for training data and limitations."
    ),
    version=model.metadata["model_version"],
)

_allowed_origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    m = model.metadata
    return ModelInfoResponse(
        model_version=m["model_version"],
        selected_model=m["selected_model"],
        n_training_rows=m["n_training_rows"],
        class_balance={str(k): v for k, v in m["class_balance"].items()},
        held_out_test=m["held_out_test"],
        limitations=m["limitations"],
        feature_columns=m["feature_columns"],
    )


@app.post("/assess", response_model=AssessResponse)
def assess(req: AssessRequest) -> AssessResponse:
    return model.assess(req)


@app.post("/whatif", response_model=AssessResponse)
def whatif(req: AssessRequest) -> AssessResponse:
    # Identical computation to /assess. Kept as a separate route (rather than
    # a query param) so the frontend/what-if UI never risks it being confused
    # for a persisted, history-tracked assessment.
    return model.assess(req)


# ---------------------------------------------------------------------------
# Ultrasound screening (research prototype)
#
# Uploaded images are read into memory, used for the prediction, and dropped.
# Nothing is written to disk and no image bytes are logged.
# ---------------------------------------------------------------------------


async def _read_upload(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload a PNG, JPEG, WebP, or BMP image.",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file was empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )
    return data


@app.get("/ultrasound-info")
def ultrasound_info() -> dict:
    """Whether the ultrasound model artifact exists, plus its metadata."""
    return {
        "available": ultrasound_model.available,
        "metadata": ultrasound_model.metadata,
    }


@app.post("/predict-ultrasound")
async def predict_ultrasound(file: UploadFile = File(...), gradcam: bool = False) -> dict:
    data = await _read_upload(file)
    try:
        if gradcam:
            return ultrasound_model.gradcam(data)
        return ultrasound_model.predict(data)
    except UltrasoundModelUnavailable as exc:
        # 503: the endpoint exists and is wired up, but no trained artifact is
        # present. We never substitute a placeholder probability.
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/ultrasound-gradcam")
async def ultrasound_gradcam(file: UploadFile = File(...)) -> dict:
    data = await _read_upload(file)
    try:
        return ultrasound_model.gradcam(data)
    except UltrasoundModelUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
