from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from ..models.vendor import VendorStatus


class VendorBase(BaseModel):
    name: str
    description: Optional[str] = None
    vendor_image: Optional[str] = Field(default=None, alias="vendorImage")
    url: Optional[str] = None
    api_url: Optional[str] = Field(default=None, alias="apiUrl")
    note: Optional[str] = None
    status: VendorStatus = VendorStatus.enabled

    class Config:
        allow_population_by_field_name = True


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    vendor_image: Optional[str] = None
    url: Optional[str] = None
    api_url: Optional[str] = None
    note: Optional[str] = None
    status: Optional[VendorStatus] = None


class VendorRead(VendorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
