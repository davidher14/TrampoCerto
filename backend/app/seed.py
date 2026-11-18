"""Cria dados de demonstração para uso local e testes manuais."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import (
    Application,
    ApplicationFeedback,
    CandidateProfile,
    Company,
    Education,
    Experience,
    Job,
    Language,
    Skill,
    User,
)

EMPRESA_EMAIL = "empresa@trampocerto.example.com"
EMPRESA_SENHA = "Empresa12345"
CANDIDATO_EMAIL = "candidato@trampocerto.example.com"
CANDIDATO_SENHA = "Candidato12345"
EMAILS_ANTIGOS = {
    EMPRESA_EMAIL: "empresa@trampocerto.local",
    CANDIDATO_EMAIL: "candidato@trampocerto.local",
}


def obter_ou_criar_empresa(database: Session) -> tuple[User, Company]:
    usuario = database.scalar(select(User).where(User.email == EMPRESA_EMAIL))
    if usuario is None:
        usuario = database.scalar(
            select(User).where(User.email == EMAILS_ANTIGOS[EMPRESA_EMAIL])
        )
        if usuario is not None:
            usuario.email = EMPRESA_EMAIL
    if usuario is None:
        usuario = User(
            email=EMPRESA_EMAIL,
            password_hash=hash_password(EMPRESA_SENHA),
            role="company",
        )
        usuario.company = Company(
            name="TrampoCerto Tecnologia",
            cnpj="04.252.011/0001-10",
            description="Uma empresa fictícia para demonstração do portal.",
            website="https://trampocerto.local",
        )
        database.add(usuario)
        database.flush()
    if usuario.role != "company" or usuario.company is None:
        raise RuntimeError(f"O e-mail {EMPRESA_EMAIL} já pertence a outro perfil.")
    return usuario, usuario.company


def obter_ou_criar_candidato(database: Session) -> tuple[User, CandidateProfile]:
    usuario = database.scalar(select(User).where(User.email == CANDIDATO_EMAIL))
    if usuario is None:
        usuario = database.scalar(
            select(User).where(User.email == EMAILS_ANTIGOS[CANDIDATO_EMAIL])
        )
        if usuario is not None:
            usuario.email = CANDIDATO_EMAIL
    if usuario is None:
        usuario = User(
            email=CANDIDATO_EMAIL,
            password_hash=hash_password(CANDIDATO_SENHA),
            role="candidate",
        )
        usuario.candidate_profile = CandidateProfile(
            full_name="Joana de Exemplo",
            phone="41999990000",
            city="Curitiba",
            state="PR",
            headline="Desenvolvedora Python",
            summary="Profissional com experiência em APIs e sistemas web.",
            portfolio_url="https://portfolio.example",
        )
        database.add(usuario)
        database.flush()
    if usuario.role != "candidate" or usuario.candidate_profile is None:
        raise RuntimeError(f"O e-mail {CANDIDATO_EMAIL} já pertence a outro perfil.")
    perfil = usuario.candidate_profile
    if not perfil.experiences:
        perfil.experiences.append(
            Experience(
                company_name="Laboratório Exemplo",
                job_title="Desenvolvedora de software",
                description="Implementação e manutenção de serviços web.",
                start_date=date(2022, 1, 1),
                is_current=True,
            )
        )
    if not perfil.educations:
        perfil.educations.append(
            Education(
                institution="Universidade Exemplo",
                course="Sistemas de Informação",
                degree_level="Bacharelado",
                start_date=date(2018, 1, 1),
                end_date=date(2021, 12, 31),
            )
        )
    if not perfil.skills:
        perfil.skills.append(Skill(name="Python", proficiency="Avançado"))
        perfil.skills.append(Skill(name="FastAPI", proficiency="Intermediário"))
    if not perfil.languages:
        perfil.languages.append(Language(name="Português", proficiency="Nativo"))
        perfil.languages.append(Language(name="Inglês", proficiency="Avançado"))
    return usuario, perfil


def obter_ou_criar_vaga(
    database: Session,
    company_id: int,
    titulo: str,
    *,
    description: str,
    requirements: str,
    area: str,
    city: str,
    state: str,
    work_mode: str,
    contract_type: str = "clt",
    salary_min: int,
    salary_max: int,
    status: str,
) -> Job:
    vaga = database.scalar(
        select(Job).where(Job.company_id == company_id, Job.title == titulo)
    )
    if vaga is None:
        vaga = Job(
            company_id=company_id,
            title=titulo,
            description=description,
            requirements=requirements,
            area=area,
            city=city,
            state=state,
            work_mode=work_mode,
            contract_type=contract_type,
            salary_min=salary_min,
            salary_max=salary_max,
            status=status,
        )
        database.add(vaga)
        database.flush()
    return vaga


def garantir_candidatura(
    database: Session,
    job: Job,
    candidate_id: int,
    company_user_id: int,
    *,
    com_retorno: bool,
) -> None:
    candidatura = database.scalar(
        select(Application).where(
            Application.job_id == job.id,
            Application.candidate_id == candidate_id,
        )
    )
    if candidatura is None:
        candidatura = Application(
            job_id=job.id,
            candidate_id=candidate_id,
            status="interview" if com_retorno else "sent",
            cover_letter="Tenho interesse nesta oportunidade e experiência na área.",
        )
        database.add(candidatura)
        database.flush()
    if com_retorno and not candidatura.feedbacks:
        database.add(
            ApplicationFeedback(
                application_id=candidatura.id,
                author_user_id=company_user_id,
                status="interview",
                message="Seu perfil foi selecionado para a etapa de entrevista.",
            )
        )


def popular_banco(database: Session) -> None:
    usuario_empresa, empresa = obter_ou_criar_empresa(database)
    usuario_candidato, _perfil = obter_ou_criar_candidato(database)
    database.flush()

    vaga_pendente = obter_ou_criar_vaga(
        database,
        empresa.id,
        "Desenvolvedora Python",
        description="Construa e evolua serviços para uma plataforma de oportunidades.",
        requirements="Python, APIs REST e colaboração em equipe.",
        area="Tecnologia",
        city="Curitiba",
        state="PR",
        work_mode="remote",
        salary_min=6000,
        salary_max=8500,
        status="open",
    )
    vaga_com_retorno = obter_ou_criar_vaga(
        database,
        empresa.id,
        "Analista de dados",
        description="Transforme dados em análises úteis para o negócio.",
        requirements="SQL, visualização de dados e comunicação clara.",
        area="Dados",
        city="São Paulo",
        state="SP",
        work_mode="hybrid",
        salary_min=5500,
        salary_max=7500,
        status="open",
    )
    vagas_adicionais = [
        {
            "title": "Designer UX/UI Pleno",
            "description": "Crie experiências digitais acessíveis em parceria com produto e engenharia.",
            "requirements": "Experiência com Figma, pesquisa com usuários e design responsivo.",
            "area": "Design",
            "city": "São Paulo",
            "state": "SP",
            "work_mode": "hybrid",
            "salary_min": 6500,
            "salary_max": 9000,
        },
        {
            "title": "Analista de Marketing Digital",
            "description": "Planeje campanhas digitais e acompanhe resultados em diferentes canais.",
            "requirements": "Experiência com mídia paga, análise de métricas e redação.",
            "area": "Marketing",
            "city": "Recife",
            "state": "PE",
            "work_mode": "remote",
            "salary_min": 4200,
            "salary_max": 6500,
        },
        {
            "title": "Analista de Qualidade de Software",
            "description": "Ajude a garantir a qualidade dos produtos com testes manuais e automatizados.",
            "requirements": "Experiência com testes de API, documentação e automação.",
            "area": "Tecnologia",
            "city": "Florianópolis",
            "state": "SC",
            "work_mode": "remote",
            "salary_min": 5000,
            "salary_max": 7800,
        },
        {
            "title": "Assistente Financeiro",
            "description": "Apoie rotinas de contas a pagar, conciliação e organização financeira.",
            "requirements": "Atenção aos detalhes e conhecimento intermediário de planilhas.",
            "area": "Financeiro",
            "city": "Belo Horizonte",
            "state": "MG",
            "work_mode": "onsite",
            "salary_min": 2800,
            "salary_max": 3800,
        },
        {
            "title": "Analista de Recursos Humanos",
            "description": "Contribua com processos de recrutamento, integração e desenvolvimento.",
            "requirements": "Experiência com recrutamento e comunicação com equipes.",
            "area": "Recursos Humanos",
            "city": "Curitiba",
            "state": "PR",
            "work_mode": "hybrid",
            "salary_min": 4200,
            "salary_max": 6200,
        },
        {
            "title": "Estágio em Produto Digital",
            "description": "Apoie pesquisas, organização de requisitos e melhoria contínua do produto.",
            "requirements": "Estar cursando graduação e ter interesse por tecnologia e produtos digitais.",
            "area": "Produto",
            "city": "Curitiba",
            "state": "PR",
            "work_mode": "hybrid",
            "contract_type": "internship",
            "salary_min": 1600,
            "salary_max": 2200,
        },
    ]
    for dados_vaga in vagas_adicionais:
        obter_ou_criar_vaga(
            database,
            empresa.id,
            dados_vaga.pop("title"),
            status="open",
            **dados_vaga,
        )

    garantir_candidatura(
        database,
        vaga_pendente,
        usuario_candidato.id,
        usuario_empresa.id,
        com_retorno=False,
    )
    garantir_candidatura(
        database,
        vaga_com_retorno,
        usuario_candidato.id,
        usuario_empresa.id,
        com_retorno=True,
    )
    database.commit()


def main() -> None:
    with SessionLocal() as database:
        popular_banco(database)
    print("Dados de demonstração criados ou já existentes.")
    print(f"Empresa: {EMPRESA_EMAIL} / {EMPRESA_SENHA}")
    print(f"Candidato: {CANDIDATO_EMAIL} / {CANDIDATO_SENHA}")
    print("Use essas credenciais somente em ambientes locais de demonstração.")


if __name__ == "__main__":
    main()
