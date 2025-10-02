from fastapi import APIRouter, Depends

from ...api.deps import get_db
from ...repositories.model_repository import ModelRepository
from ...repositories.vendor_repository import VendorRepository
from ...schemas.common import PaginatedResponse
from ...schemas.model import ModelRead
from ...schemas.vendor import VendorRead
from ...services.model_service import ModelService
from ...services.search_service import ModelSearchParams, VendorQueryParams
from ...services.vendor_service import VendorService

def get_vendor_service() -> VendorService:
    return VendorService()

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/vendors", response_model=PaginatedResponse[VendorRead])
def list_vendors(
    params: VendorQueryParams = Depends(VendorQueryParams),
    repo: VendorRepository = Depends(VendorRepository),
    service: VendorService = Depends(get_vendor_service),
    session=Depends(get_db),
):
    page = service.list_vendors(
        session,
        repository=repo,
        status_filter=params.status,
        search=params.search,
        page=params.page,
        page_size=params.page_size,
    )
    return PaginatedResponse(
        items=[VendorRead.from_orm(vendor) for vendor in page.items],
        total=page.total,
        page=page.page,
        page_size=page.page_size,
    )


@router.get("/models", response_model=PaginatedResponse[ModelRead])
def list_models(
    params: ModelSearchParams = Depends(ModelSearchParams),
    repo: ModelRepository = Depends(ModelRepository),
    service: ModelService = Depends(ModelService),
    session=Depends(get_db),
):
    page = service.list_models(session, repository=repo, **params.dict())
    return PaginatedResponse[ModelRead](
        items=[ModelRead.from_orm(model) for model in page.items],
        total=page.total,
        page=page.page,
        page_size=page.page_size,
    )


@router.get("/models/{model_id}", response_model=ModelRead)
def get_model(
    model_id: int,
    repo: ModelRepository = Depends(ModelRepository),
    service: ModelService = Depends(ModelService),
    session=Depends(get_db),
):
    model = service.get_model(session, model_id, repository=repo)
    return ModelRead.from_orm(model)
