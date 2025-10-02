from contextlib import contextmanager
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=settings.echo_sql, connect_args=connect_args)


def init_db() -> None:
    SQLModel.metadata.create_all(bind=engine)


@contextmanager
def session_context() -> Generator[Session, None, None]:
    session = Session(bind=engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_session() -> Generator[Session, None, None]:
    with session_context() as session:
        yield session
