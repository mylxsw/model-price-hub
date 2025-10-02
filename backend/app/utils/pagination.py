from math import ceil
from typing import Generic, Iterable, List, Sequence, TypeVar

from pydantic.generics import GenericModel

T = TypeVar("T")


class Page(GenericModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int

    @property
    def pages(self) -> int:
        if self.page_size == 0:
            return 0
        return ceil(self.total / self.page_size)


def paginate(items: Sequence[T], total: int, page: int, page_size: int) -> Page[T]:
    return Page(items=list(items), total=total, page=page, page_size=page_size)
