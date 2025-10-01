from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel
from pydantic.generics import GenericModel

T = TypeVar("T")


class Message(BaseModel):
    message: str


class Pagination(BaseModel):
    total: int
    page: int
    page_size: int


class PaginatedResponse(GenericModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int


class QueryParams(BaseModel):
    page: int = 1
    page_size: int = 20
    status: Optional[str] = None
    search: Optional[str] = None
