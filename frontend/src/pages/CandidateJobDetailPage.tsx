import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { FavoriteButton } from "../components/FavoriteButton";
import {
  CandidatePage,
  ErrorState,
  LoadingState,
} from "../components/CandidatePage";
import { useToast } from "../components/ToastProvider";
import {
  candidatar,
  candidateQueryKeys,
  obterCandidaturas,
  obterPerfilCandidato,
  obterVaga,
  obterVagasSalvas,
} from "../lib/candidateApi";
import { obterMensagemErro } from "../lib/api";
import {
  formatarData,
  formatarSalario,
  nomeContrato,
  nomeModalidade,
} from "../lib/candidateFormat";

export function CandidateJobDetailPage() {
  const { jobId: jobIdParam } = useParams();
  const jobId = Number(jobIdParam);
  const queryClient = useQueryClient();
  const { mostrarToast } = useToast();
  const [carta, setCarta] = useState("");

  const vaga = useQuery({
    queryKey: candidateQueryKeys.job(jobId),
    queryFn: () => obterVaga(jobId),
    enabled: Number.isSafeInteger(jobId) && jobId > 0,
  });
  const salvas = useQuery({
    queryKey: candidateQueryKeys.savedJobs,
    queryFn: obterVagasSalvas,
  });
  const candidaturas = useQuery({
    queryKey: candidateQueryKeys.applications,
    queryFn: obterCandidaturas,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const perfil = useQuery({
    queryKey: candidateQueryKeys.profile,
    queryFn: obterPerfilCandidato,
  });

  const candidaturaExistente = candidaturas.data?.find(
    (item) => item.job_id === jobId,
  );
  const mutacao = useMutation({
    mutationFn: () => candidatar(jobId, carta.trim() || null),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: candidateQueryKeys.applications,
      });
      setCarta("");
      mostrarToast("Candidatura enviada. Você pode acompanhar as etapas no seu espaço.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível enviar sua candidatura."),
        "erro",
      );
      if (obterMensagemErro(erro, "").toLowerCase().includes("candidat")) {
        void queryClient.invalidateQueries({
          queryKey: candidateQueryKeys.applications,
        });
      }
    },
  });

  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    return (
      <CandidatePage>
        <ErrorState titulo="O endereço desta vaga é inválido." />
      </CandidatePage>
    );
  }
  if (vaga.isPending) return <LoadingState mensagem="Carregando detalhes da vaga..." />;
  if (vaga.isError) {
    return (
      <CandidatePage>
        <ErrorState
          titulo="Esta vaga não está disponível."
          onRetry={() => void vaga.refetch()}
        />
      </CandidatePage>
    );
  }

  const dados = vaga.data;
  const jaSeCandidatou = Boolean(candidaturaExistente);

  return (
    <CandidatePage largura="max-w-5xl">
      <Link
        to="/candidato/vagas"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar à busca
      </Link>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-card sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-bold text-brand">{dados.company.name}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-navy sm:text-4xl">
              {dados.title}
            </h1>
          </div>
          <FavoriteButton
            jobId={dados.id}
            salva={Boolean(salvas.data?.some((item) => item.id === dados.id))}
          />
        </div>

        <p className="mt-5 rounded-xl bg-soft p-4 text-lg font-bold text-success sm:inline-block sm:px-5">
          {formatarSalario(
            dados.salary_min,
            dados.salary_max,
            dados.salary_currency,
          )}
        </p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600">
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" aria-hidden="true" />
            {dados.city}, {dados.state}
          </span>
          <span className="inline-flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-brand" aria-hidden="true" />
            {nomeModalidade(dados.work_mode)} · {nomeContrato(dados.contract_type)}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-brand" aria-hidden="true" />
            Publicada em {formatarData(dados.created_at)}
          </span>
        </div>

        <div className="my-8 border-t border-slate-100" />

        <div className="grid gap-8 lg:grid-cols-[1fr_19rem]">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-extrabold text-brand-dark">
                Sobre a oportunidade
              </h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                {dados.description}
              </p>
            </section>
            <section>
              <h2 className="text-xl font-extrabold text-brand-dark">
                Requisitos
              </h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                {dados.requirements}
              </p>
            </section>
          </div>

          <aside className="h-fit rounded-3xl bg-slate-50 p-5">
            <h2 className="text-lg font-extrabold text-brand-dark">
              Candidate-se com seu perfil
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A empresa receberá seu currículo padronizado
              {perfil.data?.has_resume ? " e o PDF anexado" : ""}.
              {perfil.data?.completion_percentage !== undefined &&
                perfil.data.completion_percentage < 100 &&
                " Complete seu perfil para apresentar melhor sua experiência."}
            </p>
            {perfil.data?.completion_percentage !== undefined &&
              perfil.data.completion_percentage < 100 && (
                <Link
                  to="/candidato/perfil"
                  className="mt-3 inline-block text-sm font-bold text-brand hover:underline"
                >
                  Completar perfil
                </Link>
              )}
            {jaSeCandidatou ? (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Candidatura enviada
                </p>
                <p className="mt-2 text-xs leading-5 text-emerald-800">
                  Você pode acompanhar o processo na página de candidaturas.
                </p>
                <Link
                  to="/candidato/candidaturas"
                  className="mt-3 inline-block text-sm font-bold text-emerald-900 underline"
                >
                  Acompanhar candidatura
                </Link>
              </div>
            ) : (
              <form
                className="mt-5 space-y-3"
                onSubmit={(evento) => {
                  evento.preventDefault();
                  mutacao.mutate();
                }}
              >
                <label
                  htmlFor="carta-apresentacao"
                  className="block text-sm font-bold text-brand-dark"
                >
                  Carta de apresentação{" "}
                  <span className="font-medium text-slate-400">(opcional)</span>
                </label>
                <textarea
                  id="carta-apresentacao"
                  value={carta}
                  onChange={(evento) => setCarta(evento.target.value)}
                  maxLength={10000}
                  rows={5}
                  placeholder="Conte brevemente por que esta vaga combina com você."
                  className="form-input min-h-32 resize-y"
                />
                <p className="text-right text-xs text-slate-400">
                  {carta.length}/10.000
                </p>
                <Button
                  type="submit"
                  larguraTotal
                  disabled={
                    mutacao.isPending ||
                    candidaturas.isPending ||
                    candidaturas.isError
                  }
                >
                  {mutacao.isPending ? "Enviando..." : "Candidatar-se"}
                </Button>
                {candidaturas.isError && (
                  <p className="text-xs leading-5 text-amber-800" role="status">
                    Não foi possível verificar se você já se candidatou. Tente
                    recarregar antes de enviar.
                  </p>
                )}
              </form>
            )}
          </aside>
        </div>
      </div>
    </CandidatePage>
  );
}
