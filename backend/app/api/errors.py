from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


async def tratar_erro_http(
    _request: Request, exception: StarletteHTTPException
) -> JSONResponse:
    detalhe = exception.detail
    if isinstance(detalhe, dict):
        erro = detalhe
    else:
        erro = {"code": "erro_http", "message": str(detalhe)}
    return JSONResponse(
        status_code=exception.status_code,
        content={"error": erro, "path": _request.url.path},
        headers=exception.headers,
    )


async def tratar_erro_validacao(
    _request: Request, exception: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "dados_invalidos",
                "message": "Confira os campos informados.",
                "details": [
                    {
                        "loc": item["loc"],
                        "msg": item["msg"],
                        "type": item["type"],
                    }
                    for item in jsonable_encoder(exception.errors())
                ],
            },
            "path": _request.url.path,
        },
    )


async def tratar_limite_de_requisicoes(
    request: Request, _exception: RateLimitExceeded
) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "limite_de_requisicoes",
                "message": (
                    "Muitas tentativas em pouco tempo. Aguarde e tente novamente. "
                    f"Limite aplicado: {_exception}."
                ),
            },
            "path": request.url.path,
        },
    )
