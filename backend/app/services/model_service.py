import json
import json
from typing import Iterable, Optional

from fastapi import HTTPException
from sqlmodel import Session

from ..models.model import Model
from ..repositories.model_repository import ModelRepository
from ..repositories.vendor_repository import VendorRepository
from ..schemas.model import (
    ModelBulkExportItem,
    ModelBulkImportRequest,
    ModelBulkImportResult,
    ModelCreate,
    ModelRead,
    ModelUpdate,
)
from ..utils.pagination import Page, paginate
from .vendor_service import VendorService


class ModelService:
    def __init__(self) -> None:
        pass

    def _serialize(self, payload: ModelCreate | ModelUpdate) -> dict:
        data = payload.dict(exclude_unset=True, by_alias=False)

        def _prepare_string_list(value):
            if value is None:
                return None

            if isinstance(value, list):
                cleaned = [str(item).strip() for item in value if isinstance(item, (str, int, float)) and str(item).strip()]
                return json.dumps(cleaned, ensure_ascii=False) if cleaned else None

            if isinstance(value, str):
                stripped = value.strip()
                if not stripped:
                    return None
                try:
                    parsed = json.loads(stripped)
                    if isinstance(parsed, list):
                        cleaned = [str(item).strip() for item in parsed if isinstance(item, (str, int, float)) and str(item).strip()]
                        return json.dumps(cleaned, ensure_ascii=False) if cleaned else None
                except json.JSONDecodeError:
                    pass
                return json.dumps([stripped], ensure_ascii=False)

            return json.dumps([str(value).strip()], ensure_ascii=False)

        def _prepare_price_data(value):
            if value is None:
                return None

            if isinstance(value, str):
                try:
                    parsed = json.loads(value)
                except json.JSONDecodeError:
                    return None
                if isinstance(parsed, dict):
                    return json.dumps(parsed)
                return None

            if isinstance(value, dict):
                return json.dumps(value)

            return None

        for key in ("model_capability", "license", "categories"):
            if key in data:
                data[key] = _prepare_string_list(data[key])

        if "price_data" in data:
            data["price_data"] = _prepare_price_data(data["price_data"])
        return data

    def _parse_price_data(self, value: Optional[str | dict]) -> Optional[dict]:
        if value is None:
            return None
        if isinstance(value, dict):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError:
                return None
            return parsed if isinstance(parsed, dict) else None
        return None

    def _price_sort_value(self, model: Model) -> Optional[float]:
        data = self._parse_price_data(model.price_data)
        if not data:
            return None
        model_type = model.price_model or ""
        if model_type == "free":
            return 0.0
        if model_type == "token":
            base = data.get("base")
            if isinstance(base, dict):
                for key in ("input_token_1m", "output_token_1m", "input_token_cached_1m"):
                    value = base.get(key)
                    if isinstance(value, (int, float)):
                        return float(value)
        elif model_type == "call":
            base = data.get("base")
            if isinstance(base, dict):
                price = base.get("price_per_call")
                if isinstance(price, (int, float)):
                    return float(price)
        elif model_type == "tiered":
            tiers = data.get("tiers")
            if isinstance(tiers, list) and tiers:
                first = tiers[0]
                if isinstance(first, dict):
                    def _as_float(value):
                        if isinstance(value, (int, float)):
                            return float(value)
                        if isinstance(value, str):
                            try:
                                return float(value)
                            except (TypeError, ValueError):
                                return None
                        return None

                    price = _as_float(first.get("price_per_unit"))
                    if price is not None:
                        return price
                    for key in ("input_price_per_unit", "cached_price_per_unit", "output_price_per_unit"):
                        price = _as_float(first.get(key))
                        if price is not None:
                            return price
        return None

    def list_models(
        self,
        session: Session,
        *,
        repository: ModelRepository,
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
        categories: Optional[Iterable[str]] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Page[Model]:
        offset = (page - 1) * page_size
        fetch_all = sort in {"price_asc", "price_desc"}
        query_sort = None if fetch_all else sort
        models, total = repository.search(
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
            categories=categories,
            status=status,
            search=search,
            offset=offset,
            limit=page_size,
            sort=query_sort,
            fetch_all=fetch_all,
        )

        if fetch_all:
            descending = sort == "price_desc"

            def sort_key(model: Model) -> float:
                value = self._price_sort_value(model)
                if value is None:
                    return float("-inf") if descending else float("inf")
                return value

            models = sorted(models, key=sort_key, reverse=descending)
            models = models[offset : offset + page_size]

        return paginate(models, total, page, page_size)

    def _ensure_vendor(self, session: Session, vendor_id: int, vendor_service: VendorService, vendor_repo: VendorRepository) -> None:
        vendor_service.get_vendor(session, vendor_id, vendor_repo)

    def create_model(self, session: Session, payload: ModelCreate, repository: ModelRepository, vendor_service: VendorService, vendor_repo: VendorRepository) -> Model:
        self._ensure_vendor(session, payload.vendor_id, vendor_service, vendor_repo)
        data = self._serialize(payload)
        model = Model(**data)
        return repository.create(session, model)

    def get_model(self, session: Session, model_id: int, repository: ModelRepository) -> Model:
        model = repository.get(session, model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        return model

    def update_model(self, session: Session, model_id: int, payload: ModelUpdate, repository: ModelRepository, vendor_service: VendorService, vendor_repo: VendorRepository) -> Model:
        model = self.get_model(session, model_id, repository)
        if payload.vendor_id:
            self._ensure_vendor(session, payload.vendor_id, vendor_service, vendor_repo)
        data = self._serialize(payload)
        return repository.update(session, model, data)

    def delete_model(self, session: Session, model_id: int, repository: ModelRepository) -> None:
        model = self.get_model(session, model_id, repository)
        repository.delete(session, model)

    def export_models(
        self,
        session: Session,
        repository: ModelRepository,
    ) -> list[ModelBulkExportItem]:
        models = repository.list_with_vendor(session)
        exports: list[ModelBulkExportItem] = []
        for model in models:
            read_model = ModelRead.from_orm(model)
            exports.append(ModelBulkExportItem.from_read_model(read_model))
        return exports

    def import_models(
        self,
        session: Session,
        payload: ModelBulkImportRequest,
        repository: ModelRepository,
        vendor_repository: VendorRepository,
    ) -> ModelBulkImportResult:
        created = 0
        updated = 0
        errors: list[str] = []
        seen: set[tuple[str, str]] = set()

        for index, item in enumerate(payload.items, start=1):
            vendor_key = item.vendor_name.strip().lower()
            model_key = (item.vendor_model_id or "").strip().lower()

            if not vendor_key:
                errors.append(f"Row {index}: vendor name is required")
                continue

            if not model_key:
                errors.append(f"Row {index}: vendor model id is required")
                continue

            key = (vendor_key, model_key)
            if key in seen:
                errors.append(
                    f"Row {index}: duplicate entry for vendor '{item.vendor_name}' and vendor model id '{item.vendor_model_id}'"
                )
                continue
            seen.add(key)

            vendor = vendor_repository.get_by_name(session, item.vendor_name)
            if not vendor:
                errors.append(
                    f"Row {index}: vendor '{item.vendor_name}' does not exist"
                )
                continue

            existing = repository.get_by_vendor_and_vendor_model_id(
                session, vendor.id, item.vendor_model_id
            )

            if existing:
                update_payload = item.to_model_update()
                data = self._serialize(update_payload)
                repository.update(session, existing, data)
                updated += 1
            else:
                create_payload = item.to_model_create(vendor.id)
                data = self._serialize(create_payload)
                model = Model(**data)
                repository.create(session, model)
                created += 1

        return ModelBulkImportResult(created=created, updated=updated, errors=errors)
