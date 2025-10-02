from contextlib import contextmanager
from typing import Generator

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings
from ..models.model import Model

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=settings.echo_sql, connect_args=connect_args)


def init_db() -> None:
    SQLModel.metadata.create_all(bind=engine)
    _run_schema_migrations()


def _run_schema_migrations() -> None:
    inspector = inspect(engine)

    if not inspector.has_table(Model.__tablename__):
        return

    columns = {column["name"] for column in inspector.get_columns(Model.__tablename__)}

    if "release_date" not in columns:
        try:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE model ADD COLUMN release_date DATE"))
        except SQLAlchemyError as exc:
            # Re-raise with more context so startup failure is easier to triage
            raise RuntimeError("Failed to apply schema migration adding model.release_date column") from exc


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
