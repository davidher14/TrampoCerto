from typing import Any

from fastapi.testclient import TestClient


def cadastrar_candidato(cliente: TestClient, email: str) -> dict[str, str]:
    resposta = cliente.post(
        "/api/v1/auth/cadastro/candidato",
        json={
            "email": email,
            "password": "Candidato12345",
            "full_name": "Pessoa Candidata",
        },
    )
    assert resposta.status_code == 201, resposta.text
    return {"Authorization": f"Bearer {resposta.json()['access_token']}"}


def cadastrar_empresa(cliente: TestClient, email: str) -> dict[str, str]:
    resposta = cliente.post(
        "/api/v1/auth/cadastro/empresa",
        json={
            "email": email,
            "password": "Empresa12345",
            "company_name": "Empresa de Teste",
            "cnpj": "11.222.333/0001-81",
        },
    )
    assert resposta.status_code == 201, resposta.text
    return {"Authorization": f"Bearer {resposta.json()['access_token']}"}


def dados_da_vaga(**alteracoes: Any) -> dict[str, Any]:
    dados: dict[str, Any] = {
        "title": "Desenvolvedor Python",
        "description": "Desenvolva serviços para a plataforma.",
        "requirements": "Experiência com Python e APIs.",
        "area": "Tecnologia",
        "city": "Curitiba",
        "state": "pr",
        "work_mode": "remote",
        "contract_type": "clt",
        "salary_min": 6000,
        "salary_max": 8000,
        "status": "open",
    }
    dados.update(alteracoes)
    return dados


def test_salario_e_perfil_de_empresa_sao_obrigatorios(
    client: TestClient,
) -> None:
    cabecalhos_empresa = cadastrar_empresa(client, "empresa@exemplo.com")
    cabecalhos_candidato = cadastrar_candidato(client, "candidato@exemplo.com")

    payload_sem_salario = dados_da_vaga()
    del payload_sem_salario["salary_min"]
    sem_salario = client.post(
        "/api/v1/companies/jobs",
        headers=cabecalhos_empresa,
        json=payload_sem_salario,
    )
    assert sem_salario.status_code == 422

    faixa_invalida = client.post(
        "/api/v1/companies/jobs",
        headers=cabecalhos_empresa,
        json=dados_da_vaga(salary_min=8000, salary_max=7000),
    )
    assert faixa_invalida.status_code == 422

    vaga_criada = client.post(
        "/api/v1/companies/jobs",
        headers=cabecalhos_empresa,
        json=dados_da_vaga(),
    )
    assert vaga_criada.status_code == 201

    vagas_da_empresa = client.get(
        "/api/v1/companies/jobs",
        headers=cabecalhos_empresa,
    )
    assert vagas_da_empresa.status_code == 200
    assert vagas_da_empresa.json()["total"] == 1

    painel = client.get(
        "/api/v1/companies/dashboard",
        headers=cabecalhos_empresa,
    )
    assert painel.status_code == 200
    assert painel.json()["active_jobs"] == 1

    acesso_de_candidato = client.post(
        "/api/v1/companies/jobs",
        headers=cabecalhos_candidato,
        json=dados_da_vaga(),
    )
    assert acesso_de_candidato.status_code == 403

    sem_autenticacao = client.get("/api/v1/companies/dashboard")
    assert sem_autenticacao.status_code == 401, sem_autenticacao.text


def test_candidatura_unica_retorno_obrigatorio_e_encerramento_justo(
    client: TestClient,
) -> None:
    cabecalhos_empresa = cadastrar_empresa(client, "empresa@exemplo.com")
    cabecalhos_candidato = cadastrar_candidato(client, "candidato@exemplo.com")
    vaga = client.post(
        "/api/v1/companies/jobs",
        headers=cabecalhos_empresa,
        json=dados_da_vaga(),
    )
    assert vaga.status_code == 201, vaga.text
    job_id = vaga.json()["id"]

    candidatura = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        headers=cabecalhos_candidato,
        json={"cover_letter": "Tenho experiência em APIs."},
    )
    assert candidatura.status_code == 201, candidatura.text
    application_id = candidatura.json()["id"]

    duplicada = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        headers=cabecalhos_candidato,
        json={},
    )
    assert duplicada.status_code == 409
    assert duplicada.json()["error"]["code"] == "candidatura_duplicada"

    encerramento_pendente = client.post(
        f"/api/v1/companies/jobs/{job_id}/close",
        headers=cabecalhos_empresa,
    )
    assert encerramento_pendente.status_code == 409
    pendente = encerramento_pendente.json()["error"]["pending_candidates"]
    assert len(pendente) == 1
    assert pendente[0]["application_id"] == application_id
    assert pendente[0]["name"] == "Pessoa Candidata"

    retorno_curto = client.post(
        f"/api/v1/companies/applications/{application_id}/feedback",
        headers=cabecalhos_empresa,
        json={"status": "analysis", "message": "ok"},
    )
    assert retorno_curto.status_code == 422

    retorno = client.post(
        f"/api/v1/companies/applications/{application_id}/feedback",
        headers=cabecalhos_empresa,
        json={
            "status": "interview",
            "message": "Seu perfil foi selecionado para entrevista.",
        },
    )
    assert retorno.status_code == 201, retorno.text

    encerramento = client.post(
        f"/api/v1/companies/jobs/{job_id}/close",
        headers=cabecalhos_empresa,
    )
    assert encerramento.status_code == 200
    assert encerramento.json()["status"] == "closed"

    candidaturas = client.get(
        "/api/v1/applications/me",
        headers=cabecalhos_candidato,
    )
    assert candidaturas.status_code == 200
    assert candidaturas.json()[0]["feedbacks"][0]["status"] == "interview"

    nova_candidatura = client.post(
        f"/api/v1/jobs/{job_id}/applications",
        headers=cadastrar_candidato(client, "outra@exemplo.com"),
        json={},
    )
    assert nova_candidatura.status_code == 404


def test_refresh_rotaciona_e_revoga_tokens(client: TestClient) -> None:
    cadastro = client.post(
        "/api/v1/auth/cadastro/candidato",
        json={
            "email": "rotacao@exemplo.com",
            "password": "Candidato12345",
            "full_name": "Pessoa Candidata",
        },
    )
    assert cadastro.status_code == 201
    primeiro_refresh = cadastro.json()["refresh_token"]

    renovacao = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": primeiro_refresh},
    )
    assert renovacao.status_code == 200
    segundo_refresh = renovacao.json()["refresh_token"]
    assert segundo_refresh != primeiro_refresh

    refresh_antigo = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": primeiro_refresh},
    )
    assert refresh_antigo.status_code == 401

    logout = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": segundo_refresh},
    )
    assert logout.status_code == 204

    refresh_revogado = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": segundo_refresh},
    )
    assert refresh_revogado.status_code == 401
