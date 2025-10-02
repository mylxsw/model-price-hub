from .common import PaginatedResponse
from .model import ModelRead


class ModelPaginatedResponse(PaginatedResponse[ModelRead]):
    """Paginated response wrapper for model listings."""

