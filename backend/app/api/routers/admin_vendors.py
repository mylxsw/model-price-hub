from fastapi import APIRouter, Depends, status

from ...api.deps import get_current_admin, get_db
from ...repositories.vendor_repository import VendorRepository
from ...schemas.common import PaginatedResponse
from ...schemas.vendor import VendorCreate, VendorRead, VendorUpdate
from ...services.vendor_service import VendorService

def get_vendor_service() -> VendorService:
    return VendorService()

router = APIRouter(prefix="/admin/vendors", tags=["admin-vendors"], dependencies=[Depends(get_current_admin)])


@router.get(
    "",
    response_model=PaginatedResponse[VendorRead],
    response_model_by_alias=False,
)
def list_vendors(
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    search: str | None = None,
    repo: VendorRepository = Depends(VendorRepository),
    service: VendorService = Depends(get_vendor_service),
    session=Depends(get_db),
):
    result = service.list_vendors(
        session,
        repository=repo,
        status_filter=status,
        search=search,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse[VendorRead](
        items=[VendorRead.from_orm(vendor) for vendor in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.post(
    "",
    response_model=VendorRead,
    status_code=status.HTTP_201_CREATED,
    response_model_by_alias=False,
)
def create_vendor(
    payload: VendorCreate,
    repo: VendorRepository = Depends(VendorRepository),
    service: VendorService = Depends(get_vendor_service),
    session=Depends(get_db),
):
    vendor = service.create_vendor(session, payload, repo)
    return VendorRead.from_orm(vendor)


@router.get(
    "/{vendor_id}", response_model=VendorRead, response_model_by_alias=False
)
def get_vendor(
    vendor_id: int,
    repo: VendorRepository = Depends(VendorRepository),
    service: VendorService = Depends(get_vendor_service),
    session=Depends(get_db),
):
    vendor = service.get_vendor(session, vendor_id, repo)
    return VendorRead.from_orm(vendor)


@router.put(
    "/{vendor_id}", response_model=VendorRead, response_model_by_alias=False
)
def update_vendor(
    vendor_id: int,
    payload: VendorUpdate,
    repo: VendorRepository = Depends(VendorRepository),
    service: VendorService = Depends(get_vendor_service),
    session=Depends(get_db),
):
    vendor = service.update_vendor(session, vendor_id, payload, repo)
    return VendorRead.from_orm(vendor)


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    vendor_id: int,
    repo: VendorRepository = Depends(VendorRepository),
    service: VendorService = Depends(get_vendor_service),
    session=Depends(get_db),
):
    service.delete_vendor(session, vendor_id, repo)
    return None
