from fastapi import APIRouter, Depends, status

from ...schemas.auth import LoginRequest, Token
from ...services.auth_service import AuthService, get_auth_service

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, auth_service: AuthService = Depends(get_auth_service)) -> Token:
    token = auth_service.authenticate(payload.username, payload.password)
    return Token(access_token=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> None:  # pragma: no cover - simple endpoint
    return None
