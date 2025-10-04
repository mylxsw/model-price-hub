from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Optional
from uuid import uuid4

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel

from ...api.deps import get_current_admin
from ...core.config import Settings, get_settings
from ...schemas.uploads import UploadCredentials, UploadRequest

router = APIRouter(prefix="/admin/uploads", tags=["admin-uploads"], dependencies=[Depends(get_current_admin)])


class FileUploadResponse(BaseModel):
    file_url: str
    filename: str

def ensure_storage_configured(settings: Settings) -> None:
    if not settings.s3_bucket or not settings.s3_access_key or not settings.s3_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Object storage is not configured"
        )


def create_s3_client(settings: Settings):
    ensure_storage_configured(settings)
    session = boto3.session.Session(
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region if settings.s3_region != "auto" else None
    )
    config_kwargs: dict[str, object] = {"signature_version": settings.s3_signature_version}
    if settings.s3_use_path_style:
        config_kwargs["s3"] = {"addressing_style": "path"}
    config = BotoConfig(**config_kwargs)
    endpoint_url: Optional[str] = settings.s3_endpoint or None
    return session.client("s3", endpoint_url=endpoint_url, config=config)


def build_object_key(settings: Settings, filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    prefix = settings.s3_prefix or ""
    unique = uuid4().hex
    return f"{prefix}{unique}{suffix}"


def resolve_public_url(settings: Settings, key: str) -> str:
    if settings.s3_public_base_url:
        return f"{settings.s3_public_base_url}/{key}"

    endpoint = settings.s3_endpoint.rstrip("/") if settings.s3_endpoint else None
    bucket = settings.s3_bucket
    if endpoint:
        if settings.s3_use_path_style:
            return f"{endpoint}/{bucket}/{key}"
        if endpoint.startswith("http://") or endpoint.startswith("https://"):
            scheme, host = endpoint.split("://", 1)
        else:
            scheme, host = "https", endpoint
        return f"{scheme}://{bucket}.{host}/{key}"

    region = settings.s3_region
    if region:
        return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
    return f"https://{bucket}.s3.amazonaws.com/{key}"


@router.post("/presign", response_model=UploadCredentials, deprecated=True)
def create_presigned_upload(
    payload: UploadRequest,
    settings: Settings = Depends(get_settings)
) -> UploadCredentials:
    ensure_storage_configured(settings)
    client = create_s3_client(settings)

    content_type = payload.content_type or mimetypes.guess_type(payload.filename)[0] or "application/octet-stream"
    key = build_object_key(settings, payload.filename)

    fields = {"Content-Type": content_type}
    conditions: list[dict[str, str]] = [{"Content-Type": content_type}]

    if settings.s3_upload_acl:
        fields["acl"] = settings.s3_upload_acl
        conditions.append({"acl": settings.s3_upload_acl})

    try:
        presigned = client.generate_presigned_post(
            Bucket=settings.s3_bucket,
            Key=key,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=settings.s3_presign_expire_seconds
        )
    except (BotoCoreError, ClientError) as error:
        print(f"S3 presign error: {error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to generate upload URL"
        ) from error

    return UploadCredentials(
        upload_url=presigned["url"],
        fields=presigned["fields"],
        file_url=resolve_public_url(settings, key)
    )


@router.post("/file", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings)
) -> FileUploadResponse:
    """
    Upload a file to the server, which then relays it to S3.
    """
    ensure_storage_configured(settings)
    client = create_s3_client(settings)

    key = build_object_key(settings, file.filename)

    extra_args = {"ContentType": file.content_type}
    if settings.s3_upload_acl:
        extra_args["ACL"] = settings.s3_upload_acl

    try:
        client.upload_fileobj(
            file.file,
            settings.s3_bucket,
            key,
            ExtraArgs=extra_args
        )
    except (BotoCoreError, ClientError) as error:
        print(f"S3 upload error: {error}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to upload file to object storage"
        ) from error

    return FileUploadResponse(file_url=resolve_public_url(settings, key), filename=file.filename)
