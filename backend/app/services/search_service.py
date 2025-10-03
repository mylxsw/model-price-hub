from typing import Any, Dict, Iterable, Optional

from fastapi import Query

from ..utils.filters import parse_csv


class ModelSearchParams:
    def __init__(
        self,
        *,
        vendor_id: Optional[int] = Query(default=None),
        vendor_name: Optional[str] = Query(default=None),
        model: Optional[str] = Query(default=None),
        vendor_model_id: Optional[str] = Query(default=None),
        description: Optional[str] = Query(default=None),
        min_context_tokens: Optional[int] = Query(default=None),
        max_context_tokens: Optional[int] = Query(default=None),
        capabilities: Optional[str] = Query(default=None),
        price_model: Optional[str] = Query(default=None),
        price_currency: Optional[str] = Query(default=None),
        license: Optional[str] = Query(default=None),
        categories: Optional[str] = Query(default=None),
        status: Optional[str] = Query(default=None),
        search: Optional[str] = Query(default=None),
        sort: Optional[str] = Query(default=None),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=100),
    ) -> None:
        self.vendor_id = vendor_id
        self.vendor_name = vendor_name
        self.model = model
        self.vendor_model_id = vendor_model_id
        self.description = description
        self.min_context_tokens = min_context_tokens
        self.max_context_tokens = max_context_tokens
        self.capabilities = parse_csv(capabilities)
        self.price_model = price_model
        self.price_currency = price_currency
        self.license = parse_csv(license)
        self.categories = parse_csv(categories)
        self.status = status
        self.search = search
        self.sort = sort
        self.page = page
        self.page_size = page_size

    def dict(self) -> Dict[str, Optional[Any]]:
        return {
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor_name,
            "model_name": self.model,
            "vendor_model_id": self.vendor_model_id,
            "description": self.description,
            "min_context_tokens": self.min_context_tokens,
            "max_context_tokens": self.max_context_tokens,
            "capabilities": self.capabilities,
            "price_model": self.price_model,
            "price_currency": self.price_currency,
            "license_values": self.license,
            "categories": self.categories,
            "status": self.status,
            "search": self.search,
            "sort": self.sort,
            "page": self.page,
            "page_size": self.page_size,
        }


class VendorQueryParams:
    def __init__(
        self,
        *,
        status: Optional[str] = Query(default=None),
        search: Optional[str] = Query(default=None),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=100),
    ) -> None:
        self.status = status
        self.search = search
        self.page = page
        self.page_size = page_size
