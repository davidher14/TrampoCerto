from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.db.session import get_db
from app.models import CandidateProfile, Company, RefreshToken, User
from app.schemas.auth import (
    CandidateRegistration,
    CompanyRegistration,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserSummary,
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])


def emitir_tokens(database: Session, user: User) -> TokenResponse:
    refresh_token, token_hash, expires_at = create_refresh_token(user.id)
    database.add(
        RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
    )
    database.commit()
    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        refresh_token=refresh_token,
        user=UserSummary.model_validate(user),
    )


def conflito_cadastro() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail={
            "code": "cadastro_duplicado",
            "message": "E-mail ou CNPJ já cadastrado.",
        },
    )


@router.post("/cadastro/candidato", response_model=TokenResponse, status_code=201)
def cadastrar_candidato(
    dados: CandidateRegistration, database: Session = Depends(get_db)
) -> TokenResponse:
    usuario = User(
        email=dados.email.lower(),
        password_hash=hash_password(dados.password),
        role="candidate",
    )
    usuario.candidate_profile = CandidateProfile(full_name=dados.full_name.strip())
    database.add(usuario)
    try:
        database.flush()
        return emitir_tokens(database, usuario)
    except IntegrityError as error:
        database.rollback()
        raise conflito_cadastro() from error


@router.post("/cadastro/empresa", response_model=TokenResponse, status_code=201)
def cadastrar_empresa(
    dados: CompanyRegistration, database: Session = Depends(get_db)
) -> TokenResponse:
    usuario = User(
        email=dados.email.lower(),
        password_hash=hash_password(dados.password),
        role="company",
    )
    usuario.company = Company(name=dados.company_name.strip(), cnpj=dados.cnpj)
    database.add(usuario)
    try:
        database.flush()
        return emitir_tokens(database, usuario)
    except IntegrityError as error:
        database.rollback()
        raise conflito_cadastro() from error


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.login_rate_limit)
def login(
    # O SlowAPI usa esta requisição para contabilizar tentativas por cliente.
    request: Request,
    dados: LoginRequest,
    database: Session = Depends(get_db),
) -> TokenResponse:
    usuario = database.scalar(select(User).where(User.email == dados.email.lower()))
    if usuario is None or not usuario.is_active or not verify_password(
        dados.password, usuario.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "credenciais_invalidas", "message": "E-mail ou senha inválidos."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    return emitir_tokens(database, usuario)


@router.post("/refresh", response_model=TokenResponse)
def renovar_tokens(
    dados: RefreshRequest, database: Session = Depends(get_db)
) -> TokenResponse:
    try:
        claims = decode_token(dados.refresh_token, "refresh")
        user_id = int(claims["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "refresh_invalido", "message": "Refresh token inválido ou expirado."},
        ) from error

    token_salvo = database.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(dados.refresh_token),
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc).replace(tzinfo=None),
        ).with_for_update()
    )
    usuario = database.get(User, user_id)
    if token_salvo is None or usuario is None or not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "refresh_revogado", "message": "Refresh token inválido ou revogado."},
        )

    token_salvo.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
    return emitir_tokens(database, usuario)


@router.post("/logout", status_code=204)
def logout(dados: RefreshRequest, database: Session = Depends(get_db)) -> None:
    try:
        claims = decode_token(dados.refresh_token, "refresh")
        user_id = int(claims["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        return
    token_salvo = database.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == hash_refresh_token(dados.refresh_token),
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
    )
    if token_salvo is not None:
        token_salvo.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        database.commit()
