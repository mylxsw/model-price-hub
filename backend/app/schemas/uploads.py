from typing import Dict, Optional

from pydantic import BaseModel, Field


class UploadRequest(BaseModel):
    filename: str
    content_type: Optional[str] = Field(default=None, alias="contentType")

    class Config:
        allow_population_by_field_name = True


class UploadCredentials(BaseModel):
    upload_url: str = Field(..., alias="uploadUrl")
    fields: Dict[str, str]
    file_url: str = Field(..., alias="fileUrl")

    class Config:
        allow_population_by_field_name = True
