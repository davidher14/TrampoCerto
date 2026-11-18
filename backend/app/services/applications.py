from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Application,
    ApplicationFeedback,
    Job,
)
from app.repositories.applications import obter_candidatura_da_empresa
from app.repositories.jobs import obter_vaga_da_empresa
from app.services.errors import (
    CandidaturaNaoEncontrada,
    VagaEncerrada,
    VagaIndisponivel,
)


def criar_candidatura(
    database: Session, job_id: int, candidate_id: int, cover_letter: str | None
) -> Application:
    vaga = database.scalar(select(Job).where(Job.id == job_id).with_for_update())
    if vaga is None or vaga.status != "open":
        raise VagaIndisponivel()

    candidatura = Application(
        job_id=job_id,
        candidate_id=candidate_id,
        cover_letter=cover_letter,
        status="sent",
    )
    database.add(candidatura)
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise
    candidatura_carregada = database.scalar(
        select(Application)
        .where(Application.id == candidatura.id)
        .options(
            selectinload(Application.job).selectinload(Job.company),
            selectinload(Application.feedbacks),
        )
    )
    if candidatura_carregada is None:
        raise RuntimeError("A candidatura foi criada, mas não pôde ser carregada.")
    return candidatura_carregada


def registrar_retorno(
    database: Session,
    application_id: int,
    company_user_id: int,
    author_user_id: int,
    status_retorno: str,
    mensagem: str,
) -> ApplicationFeedback:
    candidatura_ref = database.scalar(
        select(Application.job_id).where(Application.id == application_id)
    )
    if candidatura_ref is None:
        raise CandidaturaNaoEncontrada()
    vaga = obter_vaga_da_empresa(
        database, candidatura_ref, company_user_id, bloquear=True
    )
    if vaga is None:
        raise CandidaturaNaoEncontrada()

    candidatura = obter_candidatura_da_empresa(
        database, application_id, company_user_id
    )
    if candidatura is None:
        raise CandidaturaNaoEncontrada()
    if vaga.status == "closed":
        raise VagaEncerrada()

    candidatura.status = status_retorno
    retorno = ApplicationFeedback(
        application_id=candidatura.id,
        author_user_id=author_user_id,
        status=status_retorno,
        message=mensagem.strip(),
    )
    database.add(retorno)
    database.commit()
    database.refresh(retorno)
    return retorno
