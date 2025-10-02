import json
from typing import Iterable, Optional

from fastapi import HTTPException
from sqlmodel import Session

from ..models.model import Model
from ..repositories.model_repository import ModelRepository
from ..schemas.model import ModelCreate, ModelUpdate
from ..utils.pagination import Page, paginate
from .vendor_service import VendorService


class ModelService:
    def __init__(self, repository: ModelRepository | None = None, vendor_service: VendorService | None = None) -> None:
        self.repository = repository or ModelRepository()
        self.vendor_service = vendor_service or VendorService()

    def _serialize(self, payload: ModelCreate | ModelUpdate) -> dict:
        data = payload.dict(exclude_unset=True, by_alias=False)
        for key in ("model_capability", "license"):
            if key in data and data[key] is not None:
                data[key] = json.dumps(data[key])
        if "price_data" in data and data["price_data"] is not None:
            data["price_data"] = json.dumps(data["price_data"])
        return data

    def list_models(
        self,
        session: Session,
        *,
        vendor_id: Optional[int] = None,
        vendor_name: Optional[str] = None,
        model_name: Optional[str] = None,
        vendor_model_id: Optional[str] = None,
        description: Optional[str] = None,
        min_context_tokens: Optional[int] = None,
        max_context_tokens: Optional[int] = None,
        capabilities: Optional[Iterable[str]] = None,
        price_model: Optional[str] = None,
        price_currency: Optional[str] = None,
        license_values: Optional[Iterable[str]] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Model]:
        offset = (page - 1) * page_size
        models, total = self.repository.search(
            session,
            vendor_id=vendor_id,
            vendor_name=vendor_name,
            model_name=model_name,
            vendor_model_id=vendor_model_id,
            description=description,
            min_context_tokens=min_context_tokens,
            max_context_tokens=max_context_tokens,
            capabilities=capabilities,
            price_model=price_model,
            price_currency=price_currency,
            license_values=license_values,
            status=status,
            search=search,
            offset=offset,
            limit=page_size,
        )
        return paginate(models, total, page, page_size)

    def _ensure_vendor(self, session: Session, vendor_id: int) -> None:
        self.vendor_service.get_vendor(session, vendor_id)

    def create_model(self, session: Session, payload: ModelCreate) -> Model:
        self._ensure_vendor(session, payload.vendor_id)
        data = self._serialize(payload)
        model = Model(**data)
        return self.repository.create(session, model)

    def get_model(self, session: Session, model_id: int) -> Model:
        model = self.repository.get(session, model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        return model

    def update_model(self, session: Session, model_id: int, payload: ModelUpdate) -> Model:
        model = self.get_model(session, model_id)
        if payload.vendor_id:
            self._ensure_vendor(session, payload.vendor_id)
        data = self._serialize(payload)
        return self.repository.update(session, model, data)

    def delete_model(self, session: Session, model_id: int) -> None:
        model = self.get_model(session, model_id)
        self.repository.delete(session, model)
