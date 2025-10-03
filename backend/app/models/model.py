from datetime import date
from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship

from .base import DBModel, TimestampMixin


class ModelStatus(str, Enum):
    enabled = "enabled"
    disabled = "disabled"
    outdated = "outdated"


class Model(DBModel, TimestampMixin, table=True):
    __tablename__ = "model"

    vendor_id: int = Field(foreign_key="vendor.id", index=True)
    model: str = Field(index=True)
    vendor_model_id: Optional[str] = Field(default=None, index=True)
    description: Optional[str] = None
    model_image: Optional[str] = None
    max_context_tokens: Optional[int] = None
    max_output_tokens: Optional[int] = None
    model_capability: Optional[str] = None
    model_url: Optional[str] = None
    price_model: Optional[str] = None
    price_currency: Optional[str] = None
    price_data: Optional[str] = None
    categories: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})
    release_date: Optional[date] = Field(default=None, index=True)
    note: Optional[str] = None
    license: Optional[str] = None
    status: ModelStatus = Field(default=ModelStatus.enabled, index=True)

    vendor: "Vendor" = Relationship(back_populates="models")


from .vendor import Vendor  # noqa: E402
