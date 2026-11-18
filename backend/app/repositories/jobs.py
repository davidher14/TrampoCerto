from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Company, Job


def obter_vaga_da_empresa(
    database: Session, job_id: int, user_id: int, bloquear: bool = False
) -> Job | None:
    consulta = (
        select(Job)
        .join(Company)
        .where(Job.id == job_id, Company.user_id == user_id)
        .options(selectinload(Job.company))
    )
    if bloquear:
        consulta = consulta.with_for_update()
    return database.scalar(consulta)
