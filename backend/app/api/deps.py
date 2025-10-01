from typing import Generator

from fastapi import Depends
from sqlmodel import Session

from ..core.database import get_session
from ..services.auth_service import AuthService, get_auth_service


def get_db() -> Generator[Session, None, None]:
    yield from get_session()


def get_current_admin(auth_service: AuthService = Depends(get_auth_service)) -> str:
    return auth_service.get_current_admin()
