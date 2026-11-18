from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.errors import (
    tratar_erro_http,
    tratar_erro_validacao,
    tratar_limite_de_requisicoes,
)
from app.api.v1 import applications, auth, dashboard, jobs, profiles
from app.core.config import settings
from app.core.limiter import limiter
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI(
    title=settings.app_name,
    description="API do portal de empregos TrampoCerto.",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, tratar_limite_de_requisicoes)
app.add_exception_handler(StarletteHTTPException, tratar_erro_http)
app.add_exception_handler(RequestValidationError, tratar_erro_validacao)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

for router in (
    auth.router,
    jobs.router,
    applications.router,
    dashboard.router,
    profiles.router,
):
    app.include_router(router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Saúde"])
def health_check() -> dict[str, str]:
    """Endpoint simples para verificar se a API está disponível."""
    return {"status": "ok"}
