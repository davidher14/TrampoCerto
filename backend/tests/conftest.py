import os
from collections.abc import Generator

os.environ["DATABASE_URL"] = "sqlite+pysqlite://"
os.environ["JWT_SECRET_KEY"] = "segredo-de-testes-com-mais-de-32-caracteres"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    banco_de_teste = sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
    )

    def obter_banco_de_teste() -> Generator[Session, None, None]:
        with banco_de_teste() as database:
            yield database

    overrides_anteriores = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = obter_banco_de_teste
    try:
        with TestClient(app) as cliente:
            yield cliente
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(overrides_anteriores)
        Base.metadata.drop_all(engine)
        engine.dispose()
