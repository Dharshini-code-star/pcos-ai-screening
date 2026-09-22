from __future__ import annotations

from pydantic import BaseModel, Field


class AssessRequest(BaseModel):
    """One questionnaire submission. Only age/height/weight/cycle_regularity
    are required — everything else may be omitted by the user, in which case
    it's median-imputed and counted against the confidence score."""

    age: float = Field(..., ge=10, le=90)
    height_cm: float = Field(..., ge=100, le=250)
    weight_kg: float = Field(..., ge=20, le=250)
    cycle_regularity: bool = Field(..., description="true = irregular, false = regular")

    period_duration_days: float | None = Field(None, ge=0, le=30)
    weight_gain: bool | None = None
    hair_growth: bool | None = None
    skin_darkening: bool | None = None
    hair_loss: bool | None = None
    pimples: bool | None = None
    fast_food: bool | None = None
    regular_exercise: bool | None = None


class ShapContribution(BaseModel):
    feature: str
    label: str
    value: float | bool | None
    is_imputed: bool = Field(
        False, description="True if the user left this field blank and a typical value was assumed."
    )
    contribution: float
    direction: str  # "higher_risk" | "lower_risk"


class AssessResponse(BaseModel):
    model_version: str
    risk_probability: float
    risk_band: str  # "low" | "moderate" | "elevated"
    confidence_score: float
    is_insufficient_data: bool
    missing_fields: list[str]
    shap_values: list[ShapContribution]
    base_value: float
    disclaimer: str


class ModelInfoResponse(BaseModel):
    model_version: str
    selected_model: str
    n_training_rows: int
    class_balance: dict[str, int]
    held_out_test: dict
    limitations: str
    feature_columns: list[str]
