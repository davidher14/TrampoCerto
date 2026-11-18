from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import current_candidate, current_company
from app.core.storage import file_storage
from app.db.session import get_db
from app.models import Application, ApplicationFeedback, CandidateProfile, Company, Job, User
from app.repositories.applications import obter_candidatura_da_empresa
from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    CompanyApplicationOut,
    FeedbackCreate,
    FeedbackOut,
)
from app.schemas.profile import CandidateProfileOut
from app.api.v1.profiles import obter_curriculo_completo, serializar_curriculo
from app.services.applications import criar_candidatura, registrar_retorno as registrar_retorno_service
from app.services.errors import (
    CandidaturaNaoEncontrada,
    VagaEncerrada,
    VagaIndisponivel,
)

router = APIRouter(tags=["Candidaturas"])


def obter_candidatura_empresa(
    database: Session, application_id: int, user_id: int
) -> Application:
    candidatura = obter_candidatura_da_empresa(database, application_id, user_id)
    if candidatura is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "candidatura_nao_encontrada", "message": "Candidatura não encontrada."},
        )
    return candidatura


@router.post("/jobs/{job_id}/applications", response_model=ApplicationOut, status_code=201)
def candidatar(
    job_id: int,
    dados: ApplicationCreate,
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> Application:
    try:
        return criar_candidatura(database, job_id, usuario.id, dados.cover_letter)
    except VagaIndisponivel as error:
        raise HTTPException(
            status_code=404,
            detail={"code": "vaga_indisponivel", "message": "Esta vaga não está disponível."},
        ) from error
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "candidatura_duplicada", "message": "Você já se candidatou a esta vaga."},
        ) from error


@router.get("/applications/me", response_model=list[ApplicationOut])
def minhas_candidaturas(
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> list[Application]:
    return list(
        database.scalars(
            select(Application)
            .where(Application.candidate_id == usuario.id)
            .options(
                selectinload(Application.job).selectinload(Job.company),
                selectinload(Application.feedbacks),
            )
            .order_by(Application.applied_at.desc())
        ).all()
    )


@router.get("/companies/jobs/{job_id}/applications", response_model=list[CompanyApplicationOut])
def listar_candidatos(
    job_id: int,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> list[CompanyApplicationOut]:
    vaga = database.scalar(
        select(Job).join(Company).where(Job.id == job_id, Company.user_id == usuario.id)
    )
    if vaga is None:
        raise HTTPException(status_code=404, detail={"code": "vaga_nao_encontrada", "message": "Vaga não encontrada."})
    candidaturas = database.execute(
        select(Application, CandidateProfile, User)
        .join(CandidateProfile, CandidateProfile.user_id == Application.candidate_id)
        .join(User, User.id == CandidateProfile.user_id)
        .where(Application.job_id == job_id)
        .options(selectinload(Application.feedbacks))
        .order_by(Application.applied_at.desc())
    ).all()
    return [
        CompanyApplicationOut(
            id=candidatura.id,
            job_id=candidatura.job_id,
            candidate_id=perfil.user_id,
            candidate_name=perfil.full_name,
            candidate_email=usuario_candidato.email,
            headline=perfil.headline,
            city=perfil.city,
            state=perfil.state,
            status=candidatura.status,
            applied_at=candidatura.applied_at,
            cover_letter=candidatura.cover_letter,
            has_resume=bool(perfil.resume_path),
            feedbacks=candidatura.feedbacks,
        )
        for candidatura, perfil, usuario_candidato in candidaturas
    ]


@router.get(
    "/companies/applications/{application_id}/candidate-profile",
    response_model=CandidateProfileOut,
)
def ver_perfil_candidato(
    application_id: int,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> CandidateProfileOut:
    candidatura = obter_candidatura_empresa(database, application_id, usuario.id)
    perfil = obter_curriculo_completo(database, candidatura.candidate_id)
    return serializar_curriculo(perfil)


@router.get("/companies/applications/{application_id}/resume")
def baixar_curriculo(
    application_id: int,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
):
    candidatura = obter_candidatura_empresa(database, application_id, usuario.id)
    perfil = database.get(CandidateProfile, candidatura.candidate_id)
    if perfil is None or not perfil.resume_path:
        raise HTTPException(status_code=404, detail={"code": "curriculo_nao_encontrado", "message": "Este candidato não enviou currículo em PDF."})
    caminho = file_storage.resolve(perfil.resume_path)
    if not caminho.is_file():
        raise HTTPException(status_code=404, detail={"code": "arquivo_nao_encontrado", "message": "Arquivo de currículo não encontrado."})
    from fastapi.responses import FileResponse

    return FileResponse(caminho, media_type="application/pdf", filename="curriculo.pdf")


@router.post(
    "/companies/applications/{application_id}/feedback",
    response_model=FeedbackOut,
    status_code=201,
)
def registrar_retorno(
    application_id: int,
    dados: FeedbackCreate,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> ApplicationFeedback:
    try:
        return registrar_retorno_service(
            database,
            application_id,
            usuario.id,
            usuario.id,
            dados.status,
            dados.message,
        )
    except CandidaturaNaoEncontrada as error:
        raise HTTPException(
            status_code=404,
            detail={"code": "candidatura_nao_encontrada", "message": "Candidatura não encontrada."},
        ) from error
    except VagaEncerrada as error:
        raise HTTPException(
            status_code=409,
            detail={"code": "vaga_encerrada", "message": "Não é possível alterar candidaturas de uma vaga encerrada."},
        ) from error
