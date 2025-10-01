from fastapi import APIRouter, Depends, status

from ...api.deps import get_current_admin, get_db
from ...schemas.common import PaginatedResponse
from ...schemas.model import ModelCreate, ModelRead, ModelUpdate
from ...services.model_service import ModelService
from ...services.search_service import ModelSearchParams

router = APIRouter(prefix="/admin/models", tags=["admin-models"], dependencies=[Depends(get_current_admin)])


@router.get("", response_model=PaginatedResponse[ModelRead])
def list_models(
    params: ModelSearchParams = Depends(ModelSearchParams),
    service: ModelService = Depends(ModelService),
    session=Depends(get_db),
):
    page = service.list_models(session, **params.dict())
    return PaginatedResponse[ModelRead](
        items=[ModelRead.from_orm(model) for model in page.items],
        total=page.total,
        page=page.page,
        page_size=page.page_size,
    )


@router.post("", response_model=ModelRead, status_code=status.HTTP_201_CREATED)
def create_model(payload: ModelCreate, service: ModelService = Depends(ModelService), session=Depends(get_db)):
    model = service.create_model(session, payload)
    return ModelRead.from_orm(model)


@router.get("/{model_id}", response_model=ModelRead)
def get_model(model_id: int, service: ModelService = Depends(ModelService), session=Depends(get_db)):
    model = service.get_model(session, model_id)
    return ModelRead.from_orm(model)


@router.put("/{model_id}", response_model=ModelRead)
def update_model(
    model_id: int,
    payload: ModelUpdate,
    service: ModelService = Depends(ModelService),
    session=Depends(get_db),
):
    model = service.update_model(session, model_id, payload)
    return ModelRead.from_orm(model)


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(model_id: int, service: ModelService = Depends(ModelService), session=Depends(get_db)):
    service.delete_model(session, model_id)
    return None
