from enum import Enum
from typing import Optional

from sqlmodel import Field, Relationship

from .base import DBModel, TimestampMixin


class VendorStatus(str, Enum):
    enabled = "enabled"
    disabled = "disabled"


class Vendor(DBModel, TimestampMixin, table=True):
    __tablename__ = "vendor"

    name: str = Field(index=True)
    description: Optional[str] = None
    vendor_image: Optional[str] = None
    url: Optional[str] = None
    api_url: Optional[str] = None
    note: Optional[str] = None
    status: VendorStatus = Field(default=VendorStatus.enabled, index=True)

    models: list["Model"] = Relationship(back_populates="vendor", sa_relationship_kwargs={"cascade": "all, delete"})


from .model import Model  # noqa: E402  # circular import fix
