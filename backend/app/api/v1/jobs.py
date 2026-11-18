from math import ceil
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import current_candidate, current_company
from app.db.session import get_db
from app.models import Application, Company, Job, SavedJob, User
from app.repositories.jobs import obter_vaga_da_empresa
from app.schemas.common import PaginatedResponse
from app.schemas.job import JobCreate, JobOut, JobUpdate
from app.services.errors import RetornosPendentes, VagaNaoEncontrada
from app.services.jobs import (
    encerrar_vaga as encerrar_vaga_service,
    exigir_retorno_para_todos,
)

router = APIRouter(tags=["Vagas"])


def obter_vaga_empresa(database: Session, job_id: int, user_id: int) -> Job:
    vaga = obter_vaga_da_empresa(database, job_id, user_id)
    if vaga is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "vaga_nao_encontrada", "message": "Vaga não encontrada."},
        )
    return vaga


@router.get("/jobs", response_model=PaginatedResponse[JobOut])
def listar_vagas(
    q: str | None = Query(default=None, max_length=120),
    city: str | None = Query(default=None, max_length=100),
    state: str | None = Query(default=None, min_length=2, max_length=2),
    work_mode: Literal["onsite", "hybrid", "remote"] | None = None,
    contract_type: Literal[
        "clt", "pj", "internship", "temporary", "freelance", "apprentice"
    ] | None = None,
    area: str | None = Query(default=None, max_length=100),
    salary_min: Decimal | None = Query(default=None, gt=0),
    salary_max: Decimal | None = Query(default=None, gt=0),
    order_by: str = Query(default="recent", pattern="^(recent|salary_asc|salary_desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    database: Session = Depends(get_db),
) -> PaginatedResponse[JobOut]:
    filtros = [Job.status == "open"]
    if q:
        termo = f"%{q.strip()}%"
        filtros.append(
            or_(
                Job.title.ilike(termo),
                Job.description.ilike(termo),
                Job.requirements.ilike(termo),
                Job.area.ilike(termo),
            )
        )
    if city:
        filtros.append(Job.city.ilike(f"%{city.strip()}%"))
    if state:
        filtros.append(Job.state == state.upper())
    if work_mode:
        filtros.append(Job.work_mode == work_mode)
    if contract_type:
        filtros.append(Job.contract_type == contract_type)
    if area:
        filtros.append(Job.area.ilike(f"%{area.strip()}%"))
    if salary_min is not None:
        filtros.append(
            or_(
                Job.salary_max >= salary_min,
                and_(Job.salary_max.is_(None), Job.salary_min >= salary_min),
            )
        )
    if salary_max is not None:
        filtros.append(Job.salary_min <= salary_max)

    total = database.scalar(select(func.count()).select_from(Job).where(*filtros)) or 0
    ordenacao = {
        "recent": Job.created_at.desc(),
        "salary_asc": Job.salary_min.asc(),
        "salary_desc": Job.salary_min.desc(),
    }[order_by]
    vagas = database.scalars(
        select(Job)
        .where(*filtros)
        .options(selectinload(Job.company))
        .order_by(ordenacao, Job.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=vagas,
        page=page,
        page_size=page_size,
        total=total,
        pages=ceil(total / page_size) if total else 0,
    )


@router.get("/jobs/{job_id}", response_model=JobOut)
def obter_vaga(job_id: int, database: Session = Depends(get_db)) -> Job:
    vaga = database.scalar(
        select(Job).where(Job.id == job_id).options(selectinload(Job.company))
    )
    if vaga is None or vaga.status != "open":
        raise HTTPException(
            status_code=404,
            detail={"code": "vaga_nao_encontrada", "message": "Vaga não encontrada."},
        )
    return vaga


@router.post("/companies/jobs", response_model=JobOut, status_code=201)
def criar_vaga(
    dados: JobCreate,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> Job:
    empresa = database.scalar(select(Company).where(Company.user_id == usuario.id))
    if empresa is None:
        raise HTTPException(status_code=404, detail={"code": "empresa_nao_encontrada", "message": "Empresa não encontrada."})
    vaga = Job(company_id=empresa.id, **dados.model_dump())
    vaga.state = vaga.state.upper()
    database.add(vaga)
    database.commit()
    database.refresh(vaga)
    return obter_vaga_empresa(database, vaga.id, usuario.id)


@router.get("/companies/jobs", response_model=PaginatedResponse[JobOut])
def listar_vagas_empresa(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> PaginatedResponse[JobOut]:
    filtros = [Company.user_id == usuario.id]
    total = database.scalar(
        select(func.count(Job.id)).join(Company).where(*filtros)
    ) or 0
    vagas = database.scalars(
        select(Job)
        .join(Company)
        .where(*filtros)
        .options(selectinload(Job.company))
        .order_by(Job.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return PaginatedResponse(
        items=vagas,
        page=page,
        page_size=page_size,
        total=total,
        pages=ceil(total / page_size) if total else 0,
    )


@router.patch("/companies/jobs/{job_id}", response_model=JobOut)
def atualizar_vaga(
    job_id: int,
    dados: JobUpdate,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> Job:
    vaga = obter_vaga_da_empresa(
        database, job_id, usuario.id, bloquear=True
    )
    if vaga is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "vaga_nao_encontrada", "message": "Vaga não encontrada."},
        )
    if vaga.status == "closed":
        raise HTTPException(status_code=409, detail={"code": "vaga_encerrada", "message": "Vagas encerradas não podem ser alteradas."})
    alteracoes = dados.model_dump(exclude_unset=True)
    if vaga.status == "open" and alteracoes.get("status") == "draft":
        try:
            exigir_retorno_para_todos(database, vaga.id)
        except RetornosPendentes as error:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "retornos_pendentes",
                    "message": "A vaga não pode voltar para rascunho antes de dar retorno a todos os candidatos.",
                    "pending_candidates": error.candidatos,
                },
            ) from error
    salario_minimo = alteracoes.get("salary_min", vaga.salary_min)
    salario_maximo = alteracoes.get("salary_max", vaga.salary_max)
    if salario_maximo is not None and salario_maximo < salario_minimo:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "faixa_salarial_invalida",
                "message": "O salário máximo não pode ser menor que o mínimo.",
            },
        )
    for campo, valor in alteracoes.items():
        if campo == "state" and valor:
            valor = valor.upper()
        setattr(vaga, campo, valor)
    database.commit()
    return obter_vaga_empresa(database, vaga.id, usuario.id)


@router.delete("/companies/jobs/{job_id}", status_code=204)
def excluir_vaga(
    job_id: int,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> None:
    vaga = obter_vaga_da_empresa(
        database, job_id, usuario.id, bloquear=True
    )
    if vaga is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "vaga_nao_encontrada", "message": "Vaga não encontrada."},
        )
    total_candidaturas = database.scalar(
        select(func.count()).select_from(Application).where(Application.job_id == vaga.id)
    ) or 0
    if total_candidaturas:
        try:
            exigir_retorno_para_todos(database, vaga.id)
        except RetornosPendentes as error:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "retornos_pendentes",
                    "message": "A vaga não pode ser removida antes de dar retorno a todos os candidatos.",
                    "pending_candidates": error.candidatos,
                },
            ) from error
        raise HTTPException(
            status_code=409,
            detail={
                "code": "vaga_com_historico",
                "message": "Vagas com candidaturas devem ser encerradas para preservar o histórico do processo.",
            },
        )
    database.delete(vaga)
    database.commit()


@router.post("/companies/jobs/{job_id}/close")
def encerrar_vaga(
    job_id: int,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        vaga = encerrar_vaga_service(database, job_id, usuario.id)
    except VagaNaoEncontrada as error:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "vaga_nao_encontrada",
                "message": "Vaga não encontrada.",
            },
        ) from error
    except RetornosPendentes as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "retornos_pendentes",
                "message": "A vaga não pode ser encerrada antes de dar retorno a todos os candidatos.",
                "pending_candidates": error.candidatos,
            },
        ) from error
    return {"job_id": vaga.id, "status": "closed", "message": "Vaga encerrada com sucesso."}


@router.post("/jobs/{job_id}/saved", status_code=201)
def salvar_vaga(
    job_id: int,
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> dict[str, str]:
    vaga = database.get(Job, job_id)
    if vaga is None or vaga.status != "open":
        raise HTTPException(status_code=404, detail={"code": "vaga_nao_encontrada", "message": "Vaga não encontrada."})
    salvo = database.scalar(
        select(SavedJob).where(
            SavedJob.candidate_id == usuario.id, SavedJob.job_id == job_id
        )
    )
    if salvo is None:
        database.add(SavedJob(candidate_id=usuario.id, job_id=job_id))
        database.commit()
    return {"message": "Vaga adicionada aos favoritos."}


@router.delete("/jobs/{job_id}/saved", status_code=204)
def remover_vaga_salva(
    job_id: int,
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> None:
    salvo = database.scalar(
        select(SavedJob).where(
            SavedJob.candidate_id == usuario.id, SavedJob.job_id == job_id
        )
    )
    if salvo is not None:
        database.delete(salvo)
        database.commit()


@router.get("/jobs/saved/me", response_model=list[JobOut])
def listar_vagas_salvas(
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> list[Job]:
    return list(
        database.scalars(
            select(Job)
            .join(SavedJob, SavedJob.job_id == Job.id)
            .where(SavedJob.candidate_id == usuario.id)
            .options(selectinload(Job.company))
            .order_by(SavedJob.created_at.desc())
        ).all()
    )
