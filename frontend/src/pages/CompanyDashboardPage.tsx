import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../components/ButtonLink";
import {
  CompanyEmpty,
  CompanyError,
  CompanyLoading,
  CompanyPage,
  CompanyPageHeader,
} from "../components/CompanyPage";
import { companyQueryKeys, listarVagasEmpresa, obterPainelEmpresa, obterPerfilEmpresa } from "../lib/companyApi";
import { formatarSalario, nomeContrato, nomeModalidade } from "../lib/candidateFormat";

export function CompanyDashboardPage() {
  const painel = useQuery({
    queryKey: companyQueryKeys.dashboard,
    queryFn: obterPainelEmpresa,
  });
  const perfil = useQuery({
    queryKey: companyQueryKeys.profile,
    queryFn: obterPerfilEmpresa,
  });
  const vagas = useQuery({
    queryKey: companyQueryKeys.jobs,
    queryFn: listarVagasEmpresa,
  });

  if (painel.isPending || perfil.isPending) {
    return <CompanyLoading mensagem="Abrindo o painel da empresa..." />;
  }
  if (painel.isError || perfil.isError) {
    return (
      <CompanyPage>
        <CompanyError
          titulo="Não foi possível carregar o painel da empresa."
          onRetry={() => {
            void painel.refetch();
            void perfil.refetch();
          }}
        />
      </CompanyPage>
    );
  }

  const nome = perfil.data.name.trim() || "sua empresa";

  return (
    <CompanyPage>
      <CompanyPageHeader
        eyebrow="Painel da empresa"
        title={`Olá, ${nome}!`}
        description="Acompanhe suas oportunidades, candidaturas e retornos pendentes em um só lugar."
      >
        <ButtonLink to="/empresa/vagas/nova" className="w-full sm:w-auto">
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Publicar uma vaga
        </ButtonLink>
      </CompanyPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Resumo
          icone={BriefcaseBusiness}
          titulo="Vagas ativas"
          valor={painel.data.active_jobs}
          detalhe="Oportunidades abertas"
          href="/empresa/vagas"
        />
        <Resumo
          icone={UsersRound}
          titulo="Candidaturas"
          valor={painel.data.total_applications}
          detalhe="Pessoas interessadas nas suas vagas"
          href="/empresa/vagas"
        />
        <Resumo
          icone={AlertCircle}
          titulo="Retornos pendentes"
          valor={painel.data.pending_feedback}
          detalhe="Candidatos aguardando uma atualização"
          href="/empresa/vagas"
          alerta={painel.data.pending_feedback > 0}
        />
      </div>

      {painel.data.pending_feedback > 0 && (
        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-extrabold text-amber-950">
                Há pessoas aguardando retorno
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Registre uma atualização para cada candidatura antes de encerrar
                a vaga.
              </p>
            </div>
          </div>
          <ButtonLink
            to="/empresa/vagas"
            variante="secundaria"
            className="w-full shrink-0 sm:w-auto"
          >
            Ver pendências
          </ButtonLink>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-brand">
              Gerencie seus processos
            </p>
            <h2 className="mt-1 text-2xl font-black text-brand-dark">
              Vagas recentes
            </h2>
          </div>
          <Link
            to="/empresa/vagas"
            className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            Todas as vagas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {vagas.isPending ? (
          <CompanyLoading mensagem="Carregando suas vagas..." />
        ) : vagas.isError ? (
          <CompanyError
            titulo="Não foi possível carregar suas vagas."
            onRetry={() => void vagas.refetch()}
          />
        ) : vagas.data.items.length === 0 ? (
          <CompanyEmpty
            titulo="Sua primeira oportunidade começa aqui"
            descricao="Publique uma vaga com salário informado e mantenha os candidatos por dentro do processo."
          >
            <ButtonLink
              to="/empresa/vagas/nova"
              variante="secundaria"
              className="mt-5"
            >
              Publicar vaga
            </ButtonLink>
          </CompanyEmpty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {vagas.data.items.slice(0, 4).map((vaga) => (
              <article
                key={vaga.id}
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand">{vaga.area}</p>
                    <h3 className="mt-1 text-lg font-extrabold text-brand-dark">
                      {vaga.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      vaga.status === "open"
                        ? "bg-emerald-50 text-emerald-800"
                        : vaga.status === "closed"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {vaga.status === "open"
                      ? "Aberta"
                      : vaga.status === "closed"
                        ? "Encerrada"
                        : "Rascunho"}
                  </span>
                </div>
                <p className="mt-3 text-sm font-bold text-brand-dark">
                  {formatarSalario(
                    vaga.salary_min,
                    vaga.salary_max,
                    vaga.salary_currency,
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {vaga.city}, {vaga.state} · {nomeModalidade(vaga.work_mode)} ·{" "}
                  {nomeContrato(vaga.contract_type)}
                </p>
                <Link
                  to={`/empresa/vagas/${vaga.id}/candidatos`}
                  className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  Ver candidatos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <Link
        to="/empresa/perfil"
        className="mt-8 flex items-center gap-3 rounded-3xl border border-brand/10 bg-brand-pale p-5 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block font-extrabold text-brand-dark">
            Mantenha o perfil da empresa atualizado
          </span>
          <span className="mt-1 block text-sm text-slate-600">
            Adicione uma descrição, site e logo para apresentar sua organização.
          </span>
        </span>
      </Link>
    </CompanyPage>
  );
}

function Resumo({
  icone: Icone,
  titulo,
  valor,
  detalhe,
  href,
  alerta = false,
}: {
  icone: typeof BriefcaseBusiness;
  titulo: string;
  valor: number;
  detalhe: string;
  href: string;
  alerta?: boolean;
}) {
  return (
    <Link
      to={href}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{titulo}</p>
          <p
            className={`mt-2 text-3xl font-black ${
              alerta ? "text-amber-700" : "text-brand-dark"
            }`}
          >
            {valor}
          </p>
        </div>
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl ${
            alerta ? "bg-amber-50 text-amber-700" : "bg-brand-pale text-brand"
          }`}
        >
          <Icone className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{detalhe}</p>
    </Link>
  );
}
