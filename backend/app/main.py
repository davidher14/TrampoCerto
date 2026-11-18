from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.errors import (
    tratar_erro_http,
    tratar_erro_validacao,
    tratar_limite_de_requisicoes,
)
from app.api.v1 import applications, auth, dashboard, jobs, profiles
from app.core.config import settings
from app.core.limiter import limiter

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


diretorio_frontend = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if diretorio_frontend.is_dir():
    raiz_frontend = diretorio_frontend.resolve()

    @app.get("/{caminho:path}", include_in_schema=False)
    def servir_frontend(caminho: str) -> FileResponse:
        """Serve o React no deploy integrado sem capturar rotas inexistentes da API."""
        if caminho == "api" or caminho.startswith("api/"):
            raise StarletteHTTPException(status_code=404)

        arquivo = (raiz_frontend / caminho).resolve()
        if not arquivo.is_relative_to(raiz_frontend):
            raise StarletteHTTPException(status_code=404)
        if not arquivo.is_file():
            arquivo = raiz_frontend / "index.html"
        return FileResponse(arquivo)


@app.get("/health", tags=["Saúde"])
def health_check() -> dict[str, str]:
    """Endpoint simples para verificar se a API está disponível."""
    return {"status": "ok"}
