from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application, ApplicationFeedback, CandidateProfile, Job, User
from app.repositories.jobs import obter_vaga_da_empresa
from app.services.errors import RetornosPendentes, VagaNaoEncontrada


def exigir_retorno_para_todos(database: Session, job_id: int) -> None:
    pendentes = database.execute(
        select(Application.id, CandidateProfile.full_name, User.email)
        .join(CandidateProfile, CandidateProfile.user_id == Application.candidate_id)
        .join(User, User.id == CandidateProfile.user_id)
        .where(
            Application.job_id == job_id,
            ~select(ApplicationFeedback.id)
            .where(ApplicationFeedback.application_id == Application.id)
            .exists(),
        )
        .order_by(Application.applied_at)
    ).all()
    if pendentes:
        raise RetornosPendentes(
            [
                {"application_id": item.id, "name": item.full_name, "email": item.email}
                for item in pendentes
            ]
        )


def encerrar_vaga(database: Session, job_id: int, user_id: int) -> Job:
    vaga = obter_vaga_da_empresa(database, job_id, user_id, bloquear=True)
    if vaga is None:
        raise VagaNaoEncontrada()
    if vaga.status == "closed":
        return vaga

    exigir_retorno_para_todos(database, vaga.id)

    vaga.status = "closed"
    database.commit()
    return vaga
