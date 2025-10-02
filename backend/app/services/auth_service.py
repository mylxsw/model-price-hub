from datetime import timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from ..core.config import get_settings
from ..core.database import get_session
from ..core.security import AuthError, create_access_token, decode_access_token, verify_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/auth/login")
settings = get_settings()


class AuthService:
    def __init__(self) -> None:
        self.admin_username = settings.admin_username
        self.admin_password_hash = settings.admin_password_hash

    def authenticate(self, username: str, password: str) -> str:
        if username != self.admin_username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not verify_password(password, self.admin_password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return create_access_token(username, expires_delta=timedelta(minutes=settings.access_token_expire_minutes))

    def get_current_admin(self, token: str = Depends(oauth2_scheme)) -> str:
        try:
            username = decode_access_token(token)
        except AuthError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
        if username != self.admin_username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username


def get_auth_service() -> AuthService:
    return AuthService()
