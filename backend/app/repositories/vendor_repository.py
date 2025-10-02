from typing import Optional, Sequence, Tuple

from sqlalchemy import func
from sqlmodel import Session, select

from ..models.vendor import Vendor
from .base import BaseRepository


class VendorRepository(BaseRepository[Vendor]):
    def __init__(self) -> None:
        super().__init__(Vendor)

    def search(
        self,
        session: Session,
        *,
        status: Optional[str] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[Sequence[Vendor], int]:
        statement = select(Vendor)
        if status:
            statement = statement.where(Vendor.status == status)
        if search:
            like = f"%{search.lower()}%"
            statement = statement.where(func.lower(Vendor.name).like(like))

        count_stmt = statement.with_only_columns(func.count()).order_by(None)
        total = session.exec(count_stmt).one()
        results = session.exec(statement.offset(offset).limit(limit)).all()
        return results, int(total)
