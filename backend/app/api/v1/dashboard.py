from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import current_company
from app.db.session import get_db
from app.models import Application, ApplicationFeedback, Company, Job, User

router = APIRouter(prefix="/companies", tags=["Painel da empresa"])


@router.get("/dashboard")
def painel_empresa(
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> dict[str, int]:
    empresa = database.scalar(select(Company).where(Company.user_id == usuario.id))
    if empresa is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "empresa_nao_encontrada", "message": "Empresa não encontrada."},
        )
    vagas = select(Job.id).where(Job.company_id == empresa.id)
    vagas_ativas = database.scalar(
        select(func.count(Job.id)).where(
            Job.company_id == empresa.id, Job.status == "open"
        )
    ) or 0
    total_candidaturas = database.scalar(
        select(func.count(Application.id)).where(Application.job_id.in_(vagas))
    ) or 0
    pendencias = database.scalar(
        select(func.count(Application.id))
        .where(Application.job_id.in_(vagas))
        .where(
            ~select(ApplicationFeedback.id)
            .where(ApplicationFeedback.application_id == Application.id)
            .exists()
        )
    ) or 0
    return {
        "active_jobs": vagas_ativas,
        "total_applications": total_candidaturas,
        "pending_feedback": pendencias,
    }
