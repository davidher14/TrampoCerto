from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.dependencies import current_candidate, current_company
from app.core.storage import file_storage
from app.db.session import get_db
from app.models import CandidateProfile, Company, Education, Experience, Language, Skill, User
from app.schemas.profile import (
    CandidateProfileOut,
    CandidateProfileUpdate,
    CandidateResumeUpdate,
    CompanyProfileOut,
    CompanyProfileUpdate,
    PublicCompanyProfileOut,
)

router = APIRouter(tags=["Perfis"])


def obter_curriculo_completo(database: Session, user_id: int) -> CandidateProfile:
    perfil = (
        database.query(CandidateProfile)
        .options(
            selectinload(CandidateProfile.experiences),
            selectinload(CandidateProfile.educations),
            selectinload(CandidateProfile.skills),
            selectinload(CandidateProfile.languages),
        )
        .filter(CandidateProfile.user_id == user_id)
        .first()
    )
    if perfil is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "perfil_nao_encontrado", "message": "Perfil de candidato não encontrado."},
        )
    return perfil


def serializar_curriculo(perfil: CandidateProfile) -> CandidateProfileOut:
    campos = [
        perfil.full_name,
        perfil.phone,
        perfil.city,
        perfil.state,
        perfil.headline,
        perfil.summary,
        perfil.portfolio_url,
        perfil.linkedin_url,
        perfil.github_url,
        bool(perfil.experiences),
        bool(perfil.educations),
        bool(perfil.skills),
        bool(perfil.languages),
    ]
    preenchidos = sum(bool(valor and str(valor).strip()) for valor in campos)
    return CandidateProfileOut(
        user_id=perfil.user_id,
        full_name=perfil.full_name,
        phone=perfil.phone,
        city=perfil.city,
        state=perfil.state,
        headline=perfil.headline,
        summary=perfil.summary,
        portfolio_url=perfil.portfolio_url,
        linkedin_url=perfil.linkedin_url,
        github_url=perfil.github_url,
        has_resume=bool(perfil.resume_path),
        experiences=perfil.experiences,
        educations=perfil.educations,
        skills=perfil.skills,
        languages=perfil.languages,
        completion_percentage=round(preenchidos * 100 / len(campos)),
    )


@router.get("/profiles/me", response_model=CandidateProfileOut)
def obter_meu_perfil(
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> CandidateProfileOut:
    return serializar_curriculo(obter_curriculo_completo(database, usuario.id))


@router.patch("/profiles/me", response_model=CandidateProfileOut)
def atualizar_meu_perfil(
    dados: CandidateProfileUpdate,
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> CandidateProfileOut:
    perfil = obter_curriculo_completo(database, usuario.id)
    alteracoes = dados.model_dump(exclude_unset=True)
    if alteracoes.get("state"):
        alteracoes["state"] = alteracoes["state"].upper()
    for campo, valor in alteracoes.items():
        setattr(perfil, campo, str(valor) if campo.endswith("_url") and valor else valor)
    database.commit()
    return serializar_curriculo(obter_curriculo_completo(database, usuario.id))


@router.put("/profiles/me/curriculo", response_model=CandidateProfileOut)
def atualizar_curriculo(
    dados: CandidateResumeUpdate,
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> CandidateProfileOut:
    perfil = obter_curriculo_completo(database, usuario.id)
    perfil.experiences = [Experience(**item.model_dump()) for item in dados.experiences]
    perfil.educations = [Education(**item.model_dump()) for item in dados.educations]
    perfil.skills = [Skill(**item.model_dump()) for item in dados.skills]
    perfil.languages = [Language(**item.model_dump()) for item in dados.languages]
    database.commit()
    return serializar_curriculo(obter_curriculo_completo(database, usuario.id))


async def ler_upload_seguro(
    arquivo: UploadFile, extensoes: set[str], mime_types: set[str]
) -> tuple[bytes, str]:
    extensao = Path(arquivo.filename or "").suffix.lower()
    if extensao not in extensoes or arquivo.content_type not in mime_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "arquivo_invalido", "message": "Formato de arquivo não permitido."},
        )
    conteudo = await arquivo.read(settings.max_upload_size_bytes + 1)
    if len(conteudo) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "arquivo_grande", "message": "O arquivo excede o limite de 10 MB."},
        )
    if extensao == ".pdf" and not conteudo.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "pdf_invalido", "message": "O arquivo enviado não é um PDF válido."},
        )
    return conteudo, extensao


@router.post("/profiles/me/curriculo/pdf", status_code=201)
async def enviar_curriculo_pdf(
    arquivo: Annotated[UploadFile, File()],
    usuario: User = Depends(current_candidate),
    database: Session = Depends(get_db),
) -> dict[str, str]:
    conteudo, extensao = await ler_upload_seguro(
        arquivo, {".pdf"}, {"application/pdf"}
    )
    perfil = obter_curriculo_completo(database, usuario.id)
    perfil.resume_path = file_storage.save("curriculos", extensao, conteudo)
    database.commit()
    return {"message": "Currículo enviado com sucesso.", "filename": Path(perfil.resume_path).name}


@router.get("/companies/me", response_model=CompanyProfileOut)
def obter_empresa(
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> CompanyProfileOut:
    empresa = database.query(Company).filter(Company.user_id == usuario.id).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail={"code": "empresa_nao_encontrada", "message": "Empresa não encontrada."})
    return CompanyProfileOut(
        id=empresa.id,
        user_id=empresa.user_id,
        name=empresa.name,
        cnpj=empresa.cnpj,
        description=empresa.description,
        website=empresa.website,
        has_logo=bool(empresa.logo_path),
        logo_url=empresa.logo_url,
    )


@router.get("/companies/{company_id}", response_model=PublicCompanyProfileOut)
def obter_perfil_publico_empresa(
    company_id: int, database: Session = Depends(get_db)
) -> Company:
    empresa = database.get(Company, company_id)
    if empresa is None:
        raise HTTPException(
            status_code=404,
            detail={"code": "empresa_nao_encontrada", "message": "Empresa não encontrada."},
        )
    return empresa


@router.get("/companies/{company_id}/logo")
def obter_logo_empresa(
    company_id: int, database: Session = Depends(get_db)
) -> FileResponse:
    empresa = database.get(Company, company_id)
    if empresa is None or not empresa.logo_path:
        raise HTTPException(
            status_code=404,
            detail={"code": "logo_nao_encontrado", "message": "Logo não encontrado."},
        )
    caminho = file_storage.resolve(empresa.logo_path)
    if not caminho.is_file():
        raise HTTPException(
            status_code=404,
            detail={"code": "arquivo_nao_encontrado", "message": "Arquivo de logo não encontrado."},
        )
    tipos = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
    return FileResponse(caminho, media_type=tipos[caminho.suffix.lower()])


@router.patch("/companies/me", response_model=CompanyProfileOut)
def atualizar_empresa(
    dados: CompanyProfileUpdate,
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> CompanyProfileOut:
    empresa = database.query(Company).filter(Company.user_id == usuario.id).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail={"code": "empresa_nao_encontrada", "message": "Empresa não encontrada."})
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(empresa, campo, str(valor) if campo == "website" and valor else valor)
    database.commit()
    database.refresh(empresa)
    return obter_empresa(usuario, database)


@router.post("/companies/me/logo", status_code=201)
async def enviar_logo(
    arquivo: Annotated[UploadFile, File()],
    usuario: User = Depends(current_company),
    database: Session = Depends(get_db),
) -> dict[str, str]:
    conteudo, extensao = await ler_upload_seguro(
        arquivo,
        {".png", ".jpg", ".jpeg", ".webp"},
        {"image/png", "image/jpeg", "image/webp"},
    )
    assinatura_valida = (
        (extensao == ".png" and conteudo.startswith(b"\x89PNG\r\n\x1a\n"))
        or (extensao in {".jpg", ".jpeg"} and conteudo.startswith(b"\xff\xd8\xff"))
        or (extensao == ".webp" and conteudo.startswith(b"RIFF") and conteudo[8:12] == b"WEBP")
    )
    if not assinatura_valida:
        raise HTTPException(
            status_code=422,
            detail={"code": "imagem_invalida", "message": "O conteúdo não corresponde a uma imagem permitida."},
        )
    empresa = database.query(Company).filter(Company.user_id == usuario.id).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail={"code": "empresa_nao_encontrada", "message": "Empresa não encontrada."})
    empresa.logo_path = file_storage.save("logos", extensao, conteudo)
    database.commit()
    return {"message": "Logo enviado com sucesso."}
