from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Application, Company, Job


def obter_candidatura_da_empresa(
    database: Session, application_id: int, user_id: int
) -> Application | None:
    return database.scalar(
        select(Application)
        .join(Job)
        .join(Company)
        .where(Application.id == application_id, Company.user_id == user_id)
        .options(selectinload(Application.feedbacks), selectinload(Application.job))
    )
