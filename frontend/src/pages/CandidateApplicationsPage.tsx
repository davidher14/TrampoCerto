import { useQuery } from "@tanstack/react-query";
import { Check, Circle, Clock3, MessageSquareText } from "lucide-react";
import { ButtonLink } from "../components/ButtonLink";
import {
  CandidatePage,
  CandidatePageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/CandidatePage";
import {
  candidateQueryKeys,
  obterCandidaturas,
} from "../lib/candidateApi";
import {
  formatarData,
  formatarSalario,
  nomeStatus,
} from "../lib/candidateFormat";
import type { Application, ApplicationStatus } from "../types/candidate";

const etapas = ["Enviada", "Em análise", "Entrevista", "Resultado final"];

function indiceDaEtapa(status: ApplicationStatus): number {
  if (status === "analysis") return 1;
  if (status === "interview") return 2;
  if (status === "approved" || status === "rejected") return 3;
  return 0;
}

function LinhaDoTempo({ candidatura }: { candidatura: Application }) {
  const etapaAtual = indiceDaEtapa(candidatura.status);

  return (
    <div className="relative mt-5">
      <div
        className="absolute left-[12.5%] right-[12.5%] top-4 h-1 bg-slate-100"
        aria-hidden="true"
      >
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${(etapaAtual / (etapas.length - 1)) * 100}%` }}
        />
      </div>
      <ol
        className="relative z-10 grid grid-cols-4 gap-1"
        aria-label="Etapas da candidatura"
      >
        {etapas.map((etapa, indice) => {
          const concluida = indice <= etapaAtual;
          return (
            <li
              key={etapa}
              className="flex flex-col items-center text-center"
              aria-current={indice === etapaAtual ? "step" : undefined}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full ${
                  concluida
                    ? "bg-brand text-white"
                    : "border border-slate-200 bg-white text-slate-300"
                }`}
              >
                {concluida ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Circle className="h-3 w-3" aria-hidden="true" />
                )}
              </span>
              <span
                className={`mt-2 text-[0.65rem] font-semibold leading-4 sm:text-xs ${
                  concluida ? "text-brand-dark" : "text-slate-400"
                }`}
              >
                {etapa}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CartaoCandidatura({
  candidatura,
}: {
  candidatura: Application;
}) {
  const finalizada =
    candidatura.status === "approved" || candidatura.status === "rejected";

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand">
            {candidatura.job.company.name}
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-brand-dark">
            {candidatura.job.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {candidatura.job.city}, {candidatura.job.state}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${
            candidatura.status === "approved"
              ? "bg-emerald-50 text-emerald-800"
              : candidatura.status === "rejected"
                ? "bg-slate-100 text-slate-700"
                : "bg-brand-pale text-brand-dark"
          }`}
        >
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {nomeStatus(candidatura.status)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span>Enviada em {formatarData(candidatura.applied_at)}</span>
        <span className="font-bold text-brand-dark">
          {formatarSalario(
            candidatura.job.salary_min,
            candidatura.job.salary_max,
            candidatura.job.salary_currency,
          )}
        </span>
      </div>

      <LinhaDoTempo candidatura={candidatura} />

      <section
        className={`rounded-2xl p-4 ${
          finalizada ? "bg-emerald-50/70" : "bg-slate-50"
        }`}
        aria-label="Retornos da empresa"
      >
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-brand-dark">
          <MessageSquareText className="h-4 w-4 text-brand" aria-hidden="true" />
          Retornos da empresa
        </h3>
        {candidatura.feedbacks.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sua candidatura foi enviada. Assim que a empresa atualizar o
            processo, o retorno aparecerá aqui.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {candidatura.feedbacks.map((retorno) => (
              <li
                key={retorno.id}
                className="border-l-2 border-brand/20 pl-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-brand-dark">
                    {nomeStatus(retorno.status)}
                  </p>
                  <time
                    dateTime={retorno.created_at}
                    className="text-xs text-slate-500"
                  >
                    {formatarData(retorno.created_at)}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {retorno.message}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}

export function CandidateApplicationsPage() {
  const candidaturas = useQuery({
    queryKey: candidateQueryKeys.applications,
    queryFn: obterCandidaturas,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  return (
    <CandidatePage>
      <CandidatePageHeader
        eyebrow="Acompanhe cada etapa"
        title="Minhas candidaturas"
        description="Veja o andamento e os retornos registrados para cada oportunidade."
      />
      {candidaturas.isPending ? (
        <LoadingState mensagem="Carregando suas candidaturas..." />
      ) : candidaturas.isError ? (
        <ErrorState
          titulo="Não foi possível carregar suas candidaturas."
          onRetry={() => void candidaturas.refetch()}
        />
      ) : candidaturas.data.length === 0 ? (
        <EmptyState
          titulo="Você ainda não se candidatou"
          descricao="Encontre uma oportunidade e candidate-se usando o currículo que você montou na plataforma."
        >
          <ButtonLink to="/candidato/vagas" className="mt-5">
            Explorar vagas
          </ButtonLink>
        </EmptyState>
      ) : (
        <div className="space-y-5">
          {candidaturas.data.map((candidatura) => (
            <CartaoCandidatura
              key={candidatura.id}
              candidatura={candidatura}
            />
          ))}
        </div>
      )}
    </CandidatePage>
  );
}
