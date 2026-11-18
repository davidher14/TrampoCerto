from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import verify_password
from app.db.base import Base
from app.models import Application, ApplicationFeedback, Job, User
from app.seed import (
    CANDIDATO_EMAIL,
    CANDIDATO_SENHA,
    EMPRESA_EMAIL,
    EMPRESA_SENHA,
    popular_banco,
)


def test_seed_e_idempotente_e_cria_fluxos_de_demonstracao() -> None:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    fabrica_de_sessoes = sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
    )

    try:
        with fabrica_de_sessoes() as database:
            popular_banco(database)
            popular_banco(database)

            usuarios = list(database.scalars(select(User)).all())
            empresa = next(usuario for usuario in usuarios if usuario.email == EMPRESA_EMAIL)
            candidato = next(
                usuario for usuario in usuarios if usuario.email == CANDIDATO_EMAIL
            )
            total_vagas = database.scalar(select(func.count()).select_from(Job))
            total_candidaturas = database.scalar(
                select(func.count()).select_from(Application)
            )
            total_retornos = database.scalar(
                select(func.count()).select_from(ApplicationFeedback)
            )

            assert empresa.role == "company"
            assert candidato.role == "candidate"
            assert verify_password(EMPRESA_SENHA, empresa.password_hash)
            assert verify_password(CANDIDATO_SENHA, candidato.password_hash)
            assert total_vagas == 8
            assert total_candidaturas == 2
            assert total_retornos == 1
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()
