from fastapi import HTTPException
from sqlmodel import Session

from ..models.vendor import Vendor
from ..repositories.vendor_repository import VendorRepository
from ..schemas.vendor import VendorCreate, VendorUpdate
from ..utils.pagination import Page, paginate


class VendorService:
    def __init__(self, repository: VendorRepository | None = None) -> None:
        self.repository = repository or VendorRepository()

    def list_vendors(
        self,
        session: Session,
        *,
        status_filter: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Vendor]:
        offset = (page - 1) * page_size
        vendors, total = self.repository.search(
            session,
            status=status_filter,
            search=search,
            offset=offset,
            limit=page_size,
        )
        return paginate(vendors, total, page, page_size)

    def create_vendor(self, session: Session, payload: VendorCreate) -> Vendor:
        vendor = Vendor(**payload.dict())
        return self.repository.create(session, vendor)

    def get_vendor(self, session: Session, vendor_id: int) -> Vendor:
        vendor = self.repository.get(session, vendor_id)
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        return vendor

    def update_vendor(self, session: Session, vendor_id: int, payload: VendorUpdate) -> Vendor:
        vendor = self.get_vendor(session, vendor_id)
        data = payload.dict(exclude_unset=True)
        return self.repository.update(session, vendor, data)

    def delete_vendor(self, session: Session, vendor_id: int) -> None:
        vendor = self.get_vendor(session, vendor_id)
        if vendor.models:
            raise HTTPException(status_code=400, detail="Vendor has associated models")
        self.repository.delete(session, vendor)
