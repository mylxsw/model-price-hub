from fastapi import APIRouter, Depends, status

from ...api.deps import get_current_admin, get_db
from ...repositories.model_repository import ModelRepository
from ...repositories.vendor_repository import VendorRepository
from ...schemas.responses import ModelPaginatedResponse
from ...schemas.model import (
    ModelBulkExportItem,
    ModelBulkImportRequest,
    ModelBulkImportResult,
    ModelCreate,
    ModelRead,
    ModelUpdate,
)
from ...services.model_service import ModelService
from ...services.search_service import ModelSearchParams
from ...services.vendor_service import VendorService
from .admin_vendors import get_vendor_service

def get_model_service() -> ModelService:
    return ModelService()

router = APIRouter(prefix="/admin/models", tags=["admin-models"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=ModelPaginatedResponse)
def list_models(
    params: ModelSearchParams = Depends(ModelSearchParams),
    service: ModelService = Depends(ModelService),
    repo: ModelRepository = Depends(ModelRepository),
    session=Depends(get_db),
):
    page = service.list_models(session, repository=repo, **params.dict())
    return ModelPaginatedResponse(
        items=[ModelRead.from_orm(model) for model in page.items],
        total=page.total,
        page=page.page,
        page_size=page.page_size,
    )


@router.post("", response_model=ModelRead, status_code=status.HTTP_201_CREATED)
def create_model(
    payload: ModelCreate,
    service: ModelService = Depends(get_model_service),
    repo: ModelRepository = Depends(ModelRepository),
    vendor_service: VendorService = Depends(get_vendor_service),
    vendor_repo: VendorRepository = Depends(VendorRepository),
    session=Depends(get_db),
):
    model = service.create_model(session, payload, repo, vendor_service, vendor_repo)
    return ModelRead.from_orm(model)


@router.get("/export", response_model=list[ModelBulkExportItem])
def export_models(
    service: ModelService = Depends(ModelService),
    repo: ModelRepository = Depends(ModelRepository),
    session=Depends(get_db),
):
    return service.export_models(session, repo)


@router.post("/import", response_model=ModelBulkImportResult)
def import_models(
    payload: ModelBulkImportRequest,
    service: ModelService = Depends(ModelService),
    repo: ModelRepository = Depends(ModelRepository),
    vendor_repo: VendorRepository = Depends(VendorRepository),
    session=Depends(get_db),
):
    return service.import_models(session, payload, repo, vendor_repo)


@router.get("/{model_id}", response_model=ModelRead)
def get_model(
    model_id: int,
    service: ModelService = Depends(ModelService),
    repo: ModelRepository = Depends(ModelRepository),
    session=Depends(get_db),
):
    model = service.get_model(session, model_id, repo)
    return ModelRead.from_orm(model)


@router.put("/{model_id}", response_model=ModelRead)
def update_model(
    model_id: int,
    payload: ModelUpdate,
    service: ModelService = Depends(get_model_service),
    repo: ModelRepository = Depends(ModelRepository),
    vendor_service: VendorService = Depends(get_vendor_service),
    vendor_repo: VendorRepository = Depends(VendorRepository),
    session=Depends(get_db),
):
    model = service.update_model(session, model_id, payload, repo, vendor_service, vendor_repo)
    return ModelRead.from_orm(model)


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(
    model_id: int,
    service: ModelService = Depends(ModelService),
    repo: ModelRepository = Depends(ModelRepository),
    session=Depends(get_db),
):
    service.delete_model(session, model_id, repo)
    return None


