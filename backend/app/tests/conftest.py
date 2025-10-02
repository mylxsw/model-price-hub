import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret")

from app.api.deps import get_db  # noqa: E402
from app.core import database  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.main import app  # noqa: E402

TEST_ENGINE = create_engine("sqlite://", connect_args={"check_same_thread": False})

database.engine = TEST_ENGINE


@pytest.fixture(scope="session", autouse=True)
def prepare_database() -> Generator[None, None, None]:
    SQLModel.metadata.create_all(TEST_ENGINE)
    yield
    SQLModel.metadata.drop_all(TEST_ENGINE)


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    with Session(TEST_ENGINE) as session:
        yield session


@pytest.fixture(autouse=True)
def override_dependencies(session: Session) -> Generator[None, None, None]:
    def get_session_override() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_db] = get_session_override

    settings = get_settings()
    settings.admin_password_hash = hash_password("adminpass")

    yield

    app.dependency_overrides.clear()


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as client:
        yield client


@pytest.fixture()
def admin_token(client: TestClient) -> str:
    response = client.post("/api/admin/auth/login", json={"username": "admin", "password": "adminpass"})
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture()
def admin_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}
