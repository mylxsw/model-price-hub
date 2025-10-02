from typing import Iterable, Optional, Sequence, Tuple

from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from ..models.model import Model
from ..models.vendor import Vendor
from .base import BaseRepository


class ModelRepository(BaseRepository[Model]):
    def __init__(self) -> None:
        super().__init__(Model)

    def search(
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
        offset: int = 0,
        limit: int = 20,
        sort: Optional[str] = None,
        fetch_all: bool = False,
    ) -> Tuple[Sequence[Model], int]:
        statement = select(Model).options(selectinload(Model.vendor)).join(Vendor)

        if vendor_id is not None:
            statement = statement.where(Model.vendor_id == vendor_id)
        if vendor_name:
            like = f"%{vendor_name.lower()}%"
            statement = statement.where(func.lower(Vendor.name).like(like))
        if model_name:
            like = f"%{model_name.lower()}%"
            statement = statement.where(func.lower(Model.model).like(like))
        if vendor_model_id:
            like = f"%{vendor_model_id.lower()}%"
            statement = statement.where(func.lower(Model.vendor_model_id).like(like))
        if description:
            like = f"%{description.lower()}%"
            statement = statement.where(func.lower(Model.description).like(like))
        if min_context_tokens is not None:
            statement = statement.where(Model.max_context_tokens >= min_context_tokens)
        if max_context_tokens is not None:
            statement = statement.where(Model.max_context_tokens <= max_context_tokens)
        if capabilities:
            for capability in capabilities:
                statement = statement.where(Model.model_capability.contains(capability))
        if price_model:
            statement = statement.where(Model.price_model == price_model)
        if price_currency:
            statement = statement.where(Model.price_currency == price_currency)
        if license_values:
            for license_value in license_values:
                statement = statement.where(Model.license.contains(license_value))
        if status:
            statement = statement.where(Model.status == status)
        if search:
            like = f"%{search.lower()}%"
            statement = statement.where(
                or_(
                    func.lower(Model.model).like(like),
                    func.lower(Model.vendor_model_id).like(like),
                    func.lower(Model.description).like(like),
                    func.lower(Vendor.name).like(like),
                )
            )

        if sort:
            direction = "desc" if sort.endswith("_desc") else "asc"
            key = sort.split("_")[0]
            if key == "vendor":
                order_column = func.lower(Vendor.name)
            elif key == "model":
                order_column = func.lower(Model.model)
            elif key == "release":
                order_column = Model.release_date
            else:
                order_column = None

            if order_column is not None:
                if direction == "desc":
                    statement = statement.order_by(order_column.desc(), Model.id.desc())
                else:
                    statement = statement.order_by(order_column.asc(), Model.id.asc())
            else:
                statement = statement.order_by(Model.created_at.desc())

        if sort is None:
            statement = statement.order_by(Model.created_at.desc())

        count_stmt = statement.with_only_columns(func.count()).order_by(None)
        total = session.exec(count_stmt).one()

        if fetch_all:
            results = session.exec(statement).all()
        else:
            results = session.exec(statement.offset(offset).limit(limit)).all()
        return results, int(total)
