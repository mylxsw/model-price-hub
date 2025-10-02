import json
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, root_validator, validator

from ..models.model import ModelStatus


class ModelBase(BaseModel):
    vendor_id: int
    model: str
    vendor_model_id: Optional[str] = None
    description: Optional[str] = None
    model_image: Optional[str] = None
    max_context_tokens: Optional[int] = None
    max_output_tokens: Optional[int] = None
    model_capability: Optional[List[str]] = Field(default=None, alias="modelCapability")
    model_url: Optional[str] = Field(default=None, alias="modelUrl")
    price_model: Optional[str] = Field(default=None, alias="priceModel")
    price_currency: Optional[str] = Field(default=None, alias="priceCurrency")
    price_data: Optional[dict] = Field(default=None, alias="priceData")
    release_date: Optional[date] = Field(default=None, alias="releaseDate")
    note: Optional[str] = None
    license: Optional[List[str]] = None
    status: ModelStatus = ModelStatus.enabled

    class Config:
        allow_population_by_field_name = True

    @root_validator(pre=True)
    def ensure_lists(cls, values):  # type: ignore[override]
        mutable = dict(values)
        for field in ("model_capability", "license"):
            value = mutable.get(field)
            if isinstance(value, str):
                mutable[field] = [value]
        return mutable


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    vendor_id: Optional[int] = None
    model: Optional[str] = None
    vendor_model_id: Optional[str] = None
    description: Optional[str] = None
    model_image: Optional[str] = None
    max_context_tokens: Optional[int] = None
    max_output_tokens: Optional[int] = None
    model_capability: Optional[List[str]] = None
    model_url: Optional[str] = None
    price_model: Optional[str] = None
    price_currency: Optional[str] = None
    price_data: Optional[dict] = None
    release_date: Optional[date] = None
    note: Optional[str] = None
    license: Optional[List[str]] = None
    status: Optional[ModelStatus] = None


class VendorSummary(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True


class ModelRead(ModelBase):
    id: int
    vendor: VendorSummary
    created_at: datetime
    updated_at: datetime
    release_date: Optional[date] = None

    class Config:
        orm_mode = True
        allow_population_by_field_name = True

    @validator("model_capability", pre=True)
    def parse_capabilities(cls, value):  # type: ignore[override]
        seen = set()
        current = value
        while isinstance(current, str) and current not in seen:
            seen.add(current)
            try:
                current = json.loads(current)
            except Exception:
                break
        if isinstance(current, list):
            return [item for item in current if isinstance(item, str) and item]
        return current if current is not None else []

    @validator("price_data", pre=True)
    def parse_price(cls, value):  # type: ignore[override]
        seen = set()
        current = value
        while isinstance(current, str) and current not in seen:
            seen.add(current)
            try:
                current = json.loads(current)
            except Exception:
                break
        return current if isinstance(current, dict) else value

    @validator("license", pre=True)
    def parse_license(cls, value):  # type: ignore[override]
        seen = set()
        current = value
        while isinstance(current, str) and current not in seen:
            seen.add(current)
            try:
                current = json.loads(current)
            except Exception:
                break
        if isinstance(current, list):
            return [item for item in current if isinstance(item, str) and item]
        return current if current is not None else []
