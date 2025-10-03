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
    vendor_image: Optional[str] = None

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

    @staticmethod
    def _decode_string_list(value: object) -> list[str]:
        def expand(item: object) -> list[str]:
            if item is None:
                return []
            if isinstance(item, list):
                result: list[str] = []
                for entry in item:
                    result.extend(expand(entry))
                return result
            if isinstance(item, str):
                stripped = item.strip()
                if not stripped:
                    return []
                try:
                    parsed = json.loads(stripped)
                except Exception:
                    return [stripped]
                if isinstance(parsed, (list, str)):
                    return expand(parsed)
                return [stripped]
            return []

        decoded: list[str] = []
        for entry in expand(value):
            normalized = entry.strip()
            if normalized and normalized not in decoded:
                decoded.append(normalized)
        return decoded

    @validator("model_capability", pre=True)
    def parse_capabilities(cls, value):  # type: ignore[override]
        return cls._decode_string_list(value)

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
        return cls._decode_string_list(value)


class ModelBulkItem(BaseModel):
    vendor_name: str = Field(..., alias="vendorName")
    model: str
    vendor_model_id: Optional[str] = Field(default=None, alias="vendorModelId")
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
    status: Optional[ModelStatus] = None

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

    def to_model_create(self, vendor_id: int) -> ModelCreate:
        data = self.dict(exclude_unset=True, by_alias=False, exclude={"vendor_name"})
        data["vendor_id"] = vendor_id
        return ModelCreate(**data)

    def to_model_update(self) -> ModelUpdate:
        data = self.dict(exclude_unset=True, by_alias=False, exclude={"vendor_name"})
        return ModelUpdate(**data)


class ModelBulkImportRequest(BaseModel):
    items: List[ModelBulkItem]


class ModelBulkImportResult(BaseModel):
    created: int
    updated: int
    errors: List[str]


class ModelBulkExportItem(ModelBulkItem):
    vendor_name: str = Field(..., alias="vendorName")

    @classmethod
    def from_read_model(cls, model: ModelRead) -> "ModelBulkExportItem":
        return cls(
            vendorName=model.vendor.name,
            model=model.model,
            vendorModelId=model.vendor_model_id,
            description=model.description,
            modelImage=model.model_image,
            maxContextTokens=model.max_context_tokens,
            maxOutputTokens=model.max_output_tokens,
            modelCapability=model.model_capability,
            modelUrl=model.model_url,
            priceModel=model.price_model,
            priceCurrency=model.price_currency,
            priceData=model.price_data,
            releaseDate=model.release_date,
            note=model.note,
            license=model.license,
            status=model.status,
        )
