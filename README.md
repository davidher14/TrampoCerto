# TrampoCerto

**A vaga certa para você**

Portal web de empregos que conecta candidatos e empresas em um processo seletivo mais simples, transparente e respeitoso. O projeto foi pensado para desenvolvimento e demonstração em um grupo pequeno.

> **Atenção:** este repositório documenta uma aplicação em desenvolvimento. As contas e os dados de demonstração são fictícios. Antes de usar com dados pessoais reais ou expor o serviço na internet, configure credenciais fortes, HTTPS, backups e restrinja o acesso às pessoas convidadas.

## O que o sistema oferece

### Área pública

- Página inicial com a proposta do TrampoCerto e acesso a cadastro e login.
- Busca de vagas por palavra-chave, área, cidade, estado, modalidade, contrato e faixa salarial.
- Ordenação por publicação ou remuneração, com paginação.
- Detalhe da oportunidade com salário visível.

### Para candidatos

- Cadastro, login e área pessoal protegida por perfil.
- Currículo padronizado com dados pessoais, resumo, experiências, formação, habilidades, idiomas e links profissionais.
- Indicador de preenchimento do perfil e upload opcional de currículo PDF.
- Candidatura com o currículo da plataforma e carta de apresentação opcional.
- Bloqueio de candidaturas duplicadas para a mesma vaga.
- Vagas favoritas e painel de candidaturas.
- Acompanhamento das etapas e mensagens de retorno em linha do tempo; a tela consulta atualizações periodicamente.

### Para empresas

- Perfil da empresa com CNPJ, descrição, site e logo.
- Painel com vagas ativas, candidaturas e retornos pendentes.
- Criação, edição, publicação, encerramento e exclusão de vagas permitida pelas regras do processo.
- Lista de candidatos por oportunidade, com currículo padronizado, carta de apresentação e download opcional de PDF.
- Registro de etapa e mensagem de retorno para cada candidatura.
- Bloqueio do encerramento enquanto houver candidatos sem retorno, com identificação das pendências.

### Regras de transparência implementadas

1. **Salário obrigatório:** a API e a interface validam remuneração positiva; a faixa máxima não pode ser menor que a mínima. Não existe opção “a combinar”.
2. **Retorno obrigatório:** cada candidatura precisa receber ao menos uma atualização registrada pela empresa.
3. **Encerramento justo:** o back-end bloqueia o encerramento quando existem pendências e informa quais candidatos ainda aguardam retorno.
4. **Currículo padronizado:** os perfis seguem o mesmo formato para facilitar a avaliação.
5. **Sem candidatura duplicada:** há validação na API e restrição única no banco.

## Tecnologias e ferramentas

| Área | Tecnologias |
|---|---|
| Interface | React 18, TypeScript, Vite, Tailwind CSS 4 |
| Rotas e dados | React Router, TanStack Query, Axios |
| Formulários | React Hook Form e Zod |
| Componentes visuais | Lucide React |
| API | Python 3.12, FastAPI, Pydantic 2 |
| Persistência | SQLAlchemy 2, Alembic e MySQL 8 |
| Autenticação | JWT com access/refresh tokens e senhas com Argon2 |
| Arquivos | Armazenamento local em desenvolvimento, por meio de uma abstração substituível |
| Ambiente local | Docker Desktop, WSL 2 no Windows e Docker Compose |
| Desenvolvimento e testes | Git/GitHub, VS Code, Node.js 22+, pytest, Postman e Swagger |

O Swagger da API é gerado automaticamente pelo FastAPI. A coleção [`docs/TrampoCerto.postman_collection.json`](./docs/TrampoCerto.postman_collection.json) contém um fluxo de demonstração da API.

## Executar localmente

### Requisitos

- Git e Docker Desktop instalados e em execução. No Windows, o Docker Desktop usa WSL 2.
- Node.js 22+ somente se for executar o front-end fora do contêiner.
- Python 3.12 recomendado para os testes locais da API.

### Com Docker Compose

1. Clone o repositório e entre na pasta do projeto.
2. Crie seu arquivo de ambiente local:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Edite `.env`: substitua `JWT_SECRET_KEY`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD` por valores próprios. Para gerar valores aleatórios no PowerShell:

   ```powershell
   py -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

   Gere uma chave para o JWT e senhas distintas para o MySQL. Para senhas do banco, use caracteres hexadecimais simples, pois elas também são interpoladas na URL de conexão do Compose.

4. Construa e inicie os serviços:

   ```powershell
   docker compose up --build -d
   docker compose ps
   ```

5. A interface, a API e o Swagger estarão disponíveis em:

   - Site: `http://localhost:5173`
   - API: `http://localhost:8000`
   - Saúde da API: `http://localhost:8000/health`
   - Swagger: `http://localhost:8000/docs`

6. (Opcional) Carregue vagas e perfis fictícios para testar as telas:

   ```powershell
   docker compose exec api python -m app.seed
   ```

7. Para acompanhar logs ou parar os contêineres:

   ```powershell
   docker compose logs -f api
   docker compose down
   ```

   `docker compose down` preserva os volumes do banco e dos uploads. **Não use `docker compose down -v` se quiser conservar esses dados.**

O Compose publica as portas apenas em `127.0.0.1`, para uso local. Não exponha diretamente as portas do MySQL ou da API em uma rede pública.

### Credenciais de demonstração

O seed cria dados fictícios idempotentes: oito vagas abertas e candidaturas em etapas diferentes.

| Perfil | E-mail | Senha |
|---|---|---|
| Empresa | `empresa@trampocerto.example.com` | `Empresa12345` |
| Candidato | `candidato@trampocerto.example.com` | `Candidato12345` |

Use essas contas apenas na demonstração local. Não execute o seed em uma instância com dados reais.

### Rodar o front-end fora do Docker

Inicie API e MySQL pelo Compose, sem o serviço `web`, e depois execute o Vite localmente:

```powershell
docker compose up -d banco api
Set-Location frontend
npm ci
npm run dev
```

O Vite fica em `http://localhost:5173` e encaminha `/api` para a API local.

### Testes

Os testes da API usam SQLite isolado por teste, sem modificar o banco de desenvolvimento:

```powershell
py -3.12 -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
Set-Location backend
py -m pip install -r requirements-dev.txt
py -m pytest
```

A suíte cobre autenticação e rotação de refresh tokens, acesso por perfil, salário obrigatório, faixa salarial, candidatura duplicada, feedback, encerramento justo e idempotência do seed.

Valide e gere o front-end de produção:

```powershell
Set-Location frontend
npm ci
npm run typecheck
npm run build
```

### Postman

Importe [`docs/TrampoCerto.postman_collection.json`](./docs/TrampoCerto.postman_collection.json) no Postman e execute as requisições na ordem apresentada. Para o fluxo de demonstração, inicie o Compose e execute o seed primeiro. A coleção salva tokens e IDs automaticamente.

## Estrutura

```text
.
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── main.py
│   │   └── seed.py
│   ├── tests/
│   ├── requirements-dev.txt
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── auth/
│   │   ├── components/
│   │   ├── lib/
│   │   └── pages/
│   ├── Dockerfile
│   ├── index.html
│   └── package.json
├── docs/
│   └── TrampoCerto.postman_collection.json
├── docker-compose.yml
└── .env.example
```

## Modelo relacional

```text
users (1) ── (0..1) candidate_profiles
users (1) ── (0..1) companies
candidate_profiles (1) ── (N) experiences
candidate_profiles (1) ── (N) educations
candidate_profiles (1) ── (N) skills
candidate_profiles (1) ── (N) languages
companies (1) ── (N) jobs
jobs (1) ── (N) applications
candidate_profiles (1) ── (N) applications
applications (1) ── (N) application_feedbacks
candidate_profiles (N) ── (N) jobs, por saved_jobs
```

Cada perfil de candidato e cada empresa pertence a um usuário. `applications` possui restrição única por vaga e candidato para impedir candidaturas duplicadas. O encerramento justo é validado pela API: todas as candidaturas precisam ter um registro em `application_feedbacks` antes do fechamento. A API exige salário no cadastro e valida valores positivos e faixas coerentes.

Os campos `status`, `work_mode` e `contract_type` são strings no banco e têm valores aceitos validados nos schemas da API. Refresh tokens têm hash persistido, rotação e revogação; senhas usam Argon2.

## API v1

Todas as rotas REST abaixo usam o prefixo `/api/v1`. Rotas privadas recebem `Authorization: Bearer <access_token>`. Erros seguem o formato `{ "error": { "code": "...", "message": "...", "details": ... } }`.

| Grupo | Rotas principais |
|---|---|
| Autenticação | `POST /auth/cadastro/candidato`, `POST /auth/cadastro/empresa`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| Currículo candidato | `GET/PATCH /profiles/me`, `PUT /profiles/me/curriculo`, `POST /profiles/me/curriculo/pdf` |
| Perfil da empresa | `GET/PATCH /companies/me`, `GET /companies/{id}`, `POST /companies/me/logo`, `GET /companies/{id}/logo`, `GET /companies/dashboard` |
| Vagas públicas | `GET /jobs` (busca, filtros, ordenação e paginação), `GET /jobs/{id}` |
| Gestão de vagas | `POST/GET /companies/jobs`, `PATCH/DELETE /companies/jobs/{id}`, `POST /companies/jobs/{id}/close` |
| Candidaturas | `POST /jobs/{id}/applications`, `GET /applications/me`, `GET /companies/jobs/{id}/applications` |
| Retorno e currículo | `POST /companies/applications/{id}/feedback`, `GET /companies/applications/{id}/candidate-profile`, `GET /companies/applications/{id}/resume` |
| Favoritas | `POST/DELETE /jobs/{id}/saved`, `GET /jobs/saved/me` |

O fechamento da vaga é atômico em relação a candidaturas e retornos concorrentes: a API bloqueia a vaga durante o encerramento, novas candidaturas e registro de feedback. A exclusão física só é permitida sem candidaturas; vagas com histórico devem ser encerradas e permanecem consultáveis.

### Fluxo de exemplo (PowerShell)

```powershell
$api = "http://localhost:8000/api/v1"
$cadastro = Invoke-RestMethod -Method Post -Uri "$api/auth/cadastro/candidato" `
  -ContentType "application/json" `
  -Body '{"email":"candidato@exemplo.com","password":"SenhaForte123","full_name":"Pessoa Candidata"}'
$headers = @{ Authorization = "Bearer $($cadastro.access_token)" }
Invoke-RestMethod -Method Get -Uri "$api/profiles/me" -Headers $headers
```

Para publicar uma vaga, o corpo de `POST /companies/jobs` exige `salary_min` positivo e aceita `salary_max` opcional (não menor que o mínimo). A vaga fica pesquisável quando criada com `status: "open"`. Cada retorno exige `status` (`analysis`, `interview`, `approved` ou `rejected`) e uma mensagem de pelo menos cinco caracteres.

## Acesso privado entre amigos

Por padrão, o Docker Compose publica os serviços somente em `127.0.0.1`; portanto, a aplicação fica acessível apenas no próprio computador. Para compartilhar o acesso com amigos, prefira uma rede privada ou VPN e restrinja o acesso às pessoas convidadas. Não exponha diretamente as portas do MySQL (`3306`), da API (`8000`) ou do Vite (`5173`) à internet.

Antes de hospedar a aplicação em qualquer servidor, substitua todos os segredos e senhas de demonstração, configure HTTPS e CORS para o domínio correto, planeje backups dos dados e dos arquivos enviados e não execute o seed em uma instância com dados reais. O armazenamento de arquivos atual é local e adequado para desenvolvimento ou uma instância única; uma implantação escalável exige armazenamento compartilhado ou um serviço de objetos.

### Demonstração gratuita no Render

O arquivo [`render.yaml`](./render.yaml) configura um único serviço Docker gratuito para servir o front-end e a API no mesmo endereço. Ele usa SQLite e armazenamento temporários para evitar serviços pagos na demonstração. Importe o repositório `davidher14/TrampoCerto` no Render e selecione o Blueprint existente; o Render cria o serviço a partir dessa configuração.

O plano gratuito pode suspender o serviço após 15 minutos sem tráfego e leva cerca de um minuto para voltar. O sistema usa então um banco SQLite em disco efêmero: reinícios, suspensão ou novos deploys podem apagar contas, vagas, candidaturas e arquivos enviados. O serviço gratuito não é apropriado para dados reais nem para uso confiável. O repositório continua usando MySQL no Docker Compose local; a configuração SQLite se aplica somente ao Blueprint de demonstração.
