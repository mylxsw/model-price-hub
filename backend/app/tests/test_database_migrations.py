from sqlalchemy import create_engine, inspect, text

from app.core import database


def test_init_db_adds_release_date_column(tmp_path, monkeypatch):
    db_path = tmp_path / "legacy.db"
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE vendor (
                    id INTEGER PRIMARY KEY,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    name VARCHAR NOT NULL,
                    description VARCHAR,
                    vendor_image VARCHAR,
                    url VARCHAR,
                    api_url VARCHAR,
                    note VARCHAR,
                    status VARCHAR NOT NULL
                )
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE TABLE model (
                    id INTEGER PRIMARY KEY,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME NOT NULL,
                    vendor_id INTEGER NOT NULL,
                    model VARCHAR NOT NULL,
                    vendor_model_id VARCHAR,
                    description VARCHAR,
                    model_image VARCHAR,
                    max_context_tokens INTEGER,
                    max_output_tokens INTEGER,
                    model_capability VARCHAR,
                    model_url VARCHAR,
                    price_model VARCHAR,
                    price_currency VARCHAR,
                    price_data VARCHAR,
                    note VARCHAR,
                    license VARCHAR,
                    status VARCHAR NOT NULL,
                    FOREIGN KEY(vendor_id) REFERENCES vendor(id)
                )
                """
            )
        )

    monkeypatch.setattr(database, "engine", engine, raising=False)

    database.init_db()

    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("model")}

    assert "release_date" in columns
