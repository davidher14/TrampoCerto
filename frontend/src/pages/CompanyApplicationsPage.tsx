import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileUser,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import type { ApplicationStatus } from "../types/candidate";
import { Button } from "../components/Button";
import {
  CompanyEmpty,
  CompanyError,
  CompanyLoading,
  CompanyPage,
  CompanyPageHeader,
} from "../components/CompanyPage";
import { useToast } from "../components/ToastProvider";
import { obterMensagemErro } from "../lib/api";
import { formatarData } from "../lib/candidateFormat";
import {
  baixarCurriculoCandidato,
  companyQueryKeys,
  listarVagasEmpresa,
  listarCandidatos,
  obterPerfilCandidatoEmpresa,
  registrarFeedback,
} from "../lib/companyApi";
import type {
  CompanyApplication,
  CompanyCandidateProfile,
} from "../types/company";

const esquemaRetorno = z.object({
  status: z.enum(["analysis", "interview", "approved", "rejected"]),
  message: z.string().trim().min(5, "O retorno precisa ter pelo menos 5 caracteres.").max(10000),
});

type DadosRetorno = z.infer<typeof esquemaRetorno>;

const textoStatus: Record<ApplicationStatus, string> = {
  sent: "Enviada",
  analysis: "Em análise",
  interview: "Entrevista",
  approved: "Aprovada",
  rejected: "Não aprovada",
};

export function CompanyApplicationsPage() {
  const { jobId: jobIdParam } = useParams();
  const jobId = Number(jobIdParam);
  const candidatos = useQuery({
    queryKey: companyQueryKeys.applications(jobId),
    queryFn: () => listarCandidatos(jobId),
    enabled: Number.isSafeInteger(jobId) && jobId > 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const vagas = useQuery({
    queryKey: companyQueryKeys.jobs,
    queryFn: listarVagasEmpresa,
  });

  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    return (
      <CompanyPage>
        <CompanyError titulo="O endereço da vaga é inválido." />
      </CompanyPage>
    );
  }
  if (candidatos.isPending || vagas.isPending) {
    return <CompanyLoading mensagem="Carregando candidaturas..." />;
  }
  if (candidatos.isError || vagas.isError) {
    return (
      <CompanyPage>
        <CompanyError
          titulo="Não foi possível carregar os candidatos desta vaga."
          onRetry={() => {
            void candidatos.refetch();
            void vagas.refetch();
          }}
        />
      </CompanyPage>
    );
  }

  const vaga = vagas.data.items.find((item) => item.id === jobId);
  if (!vaga) {
    return (
      <CompanyPage>
        <CompanyError titulo="Esta vaga não foi encontrada na sua lista." />
      </CompanyPage>
    );
  }

  return (
    <CompanyPage>
      <Link
        to="/empresa/vagas"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar às vagas
      </Link>
      <CompanyPageHeader
        eyebrow="Gestão de candidatos"
        title={`Candidatos: ${vaga.title}`}
        description="Acompanhe cada candidatura, consulte o currículo e registre um retorno claro para cada pessoa."
      >
        <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-pale px-4 text-sm font-bold text-brand-dark">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          {candidatos.data.length}{" "}
          {candidatos.data.length === 1 ? "candidato" : "candidatos"}
        </span>
      </CompanyPageHeader>

      {candidatos.data.length === 0 ? (
        <CompanyEmpty
          titulo="Ainda não há candidaturas"
          descricao="Quando alguém se candidatar, o perfil e as atualizações aparecerão nesta área."
        />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-3 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-amber-800">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {candidatos.data.filter((item) => item.feedbacks.length === 0).length}{" "}
              aguardando primeiro retorno
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {candidatos.data.filter((item) => item.feedbacks.length > 0).length}{" "}
              com retorno registrado
            </span>
          </div>
          <div className="grid gap-5">
            {candidatos.data.map((candidato) => (
              <CartaoCandidato
                key={candidato.id}
                candidato={candidato}
                jobClosed={vaga.status === "closed"}
              />
            ))}
          </div>
        </>
      )}
    </CompanyPage>
  );
}

function CartaoCandidato({
  candidato,
  jobClosed,
}: {
  candidato: CompanyApplication;
  jobClosed: boolean;
}) {
  const queryClient = useQueryClient();
  const { mostrarToast } = useToast();
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const perfil = useQuery({
    queryKey: companyQueryKeys.candidateProfile(candidato.id),
    queryFn: () => obterPerfilCandidatoEmpresa(candidato.id),
    enabled: mostrarPerfil,
  });
  const form = useForm<DadosRetorno>({
    resolver: zodResolver(esquemaRetorno),
    defaultValues: {
      status:
        candidato.status === "analysis" ||
        candidato.status === "interview" ||
        candidato.status === "approved" ||
        candidato.status === "rejected"
          ? candidato.status
          : "analysis",
      message: "",
    },
    mode: "onBlur",
  });

  const feedback = useMutation({
    mutationFn: (dados: DadosRetorno) =>
      registrarFeedback(candidato.id, dados.status, dados.message.trim()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: companyQueryKeys.applications(candidato.job_id),
        }),
        queryClient.invalidateQueries({
          queryKey: companyQueryKeys.dashboard,
        }),
      ]);
      form.reset({ status: "analysis", message: "" });
      mostrarToast("Retorno registrado para esta candidatura.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível registrar o retorno."),
        "erro",
      );
    },
  });

  const baixarPdf = async () => {
    setBaixando(true);
    try {
      await baixarCurriculoCandidato(candidato.id);
      mostrarToast("Download do currículo iniciado.", "sucesso");
    } catch (erro) {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível baixar o currículo."),
        "erro",
      );
    } finally {
      setBaixando(false);
    }
  };

  const ultimoFeedback = candidato.feedbacks.at(-1);
  const statusValido: ApplicationStatus =
    candidato.status === "sent" ||
    candidato.status === "analysis" ||
    candidato.status === "interview" ||
    candidato.status === "approved" ||
    candidato.status === "rejected"
      ? candidato.status
      : "sent";

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-brand-dark">
              {candidato.candidate_name}
            </h2>
            <p className="mt-1 break-all text-sm text-slate-500">
              {candidato.candidate_email}
            </p>
            {candidato.headline && (
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {candidato.headline}
              </p>
            )}
            {(candidato.city || candidato.state) && (
              <p className="mt-1 text-xs text-slate-500">
                {[candidato.city, candidato.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${
            candidato.feedbacks.length
              ? "bg-brand-pale text-brand-dark"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          {candidato.feedbacks.length
            ? textoStatus[statusValido]
            : "Retorno pendente"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span>Candidatura enviada em {formatarData(candidato.applied_at)}</span>
        {candidato.cover_letter && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">
            Carta de apresentação incluída
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variante="secundaria"
          className="min-h-10 px-3 py-2 text-xs"
          onClick={() => setMostrarPerfil((mostrar) => !mostrar)}
          aria-expanded={mostrarPerfil}
        >
          <FileUser className="h-4 w-4" aria-hidden="true" />
          {mostrarPerfil ? "Ocultar currículo" : "Ver currículo padronizado"}
        </Button>
        {candidato.has_resume && (
          <Button
            variante="secundaria"
            className="min-h-10 px-3 py-2 text-xs"
            disabled={baixando}
            onClick={() => void baixarPdf()}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {baixando ? "Baixando..." : "Baixar PDF"}
          </Button>
        )}
      </div>

      {candidato.cover_letter && (
        <section className="mt-4 rounded-2xl bg-slate-50 p-4">
          <h3 className="text-sm font-extrabold text-brand-dark">
            Carta de apresentação
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {candidato.cover_letter}
          </p>
        </section>
      )}

      {mostrarPerfil && (
        <div className="mt-4">
          {perfil.isPending ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500" role="status">
              Carregando currículo...
            </div>
          ) : perfil.isError ? (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert">
              Não foi possível carregar o currículo.{" "}
              <button
                type="button"
                onClick={() => void perfil.refetch()}
                className="font-bold underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <ResumoPerfil perfil={perfil.data} />
          )}
        </div>
      )}

      <section className="mt-5 rounded-2xl border border-slate-100 p-4 sm:p-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-brand-dark">
          <MessageSquareText className="h-4 w-4 text-brand" aria-hidden="true" />
          Histórico de retornos
        </h3>
        {candidato.feedbacks.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Esta pessoa ainda não recebeu uma atualização. Registre um retorno
            para manter o processo transparente.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {candidato.feedbacks.map((item) => (
              <li
                key={item.id}
                className="border-l-2 border-brand/20 pl-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-brand-dark">
                    {textoStatus[item.status]}
                  </p>
                  <time
                    dateTime={item.created_at}
                    className="text-xs text-slate-500"
                  >
                    {formatarData(item.created_at)}
                  </time>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {item.message}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {!jobClosed && (
        <form
          onSubmit={form.handleSubmit((dados) => feedback.mutate(dados))}
          noValidate
          className="mt-5 rounded-2xl bg-brand-pale/60 p-4 sm:p-5"
        >
          <h3 className="text-sm font-extrabold text-brand-dark">
            {ultimoFeedback ? "Registrar nova atualização" : "Registrar retorno"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Informe a etapa e uma mensagem objetiva. Cada candidatura precisa
            ter ao menos um retorno antes do encerramento da vaga.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[13rem_1fr]">
            <div>
              <label
                htmlFor={`feedback-status-${candidato.id}`}
                className="form-label"
              >
                Etapa
              </label>
              <select
                {...form.register("status")}
                id={`feedback-status-${candidato.id}`}
                className="form-input"
              >
                <option value="analysis">Em análise</option>
                <option value="interview">Entrevista</option>
                <option value="approved">Aprovado(a)</option>
                <option value="rejected">Não aprovado(a)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor={`feedback-message-${candidato.id}`}
                className="form-label"
              >
                Mensagem de retorno
              </label>
              <textarea
                {...form.register("message")}
                id={`feedback-message-${candidato.id}`}
                maxLength={10000}
                rows={3}
                placeholder="Explique a atualização ou o resultado com respeito e clareza."
                className={`form-input min-h-24 resize-y ${
                  form.formState.errors.message ? "form-input-error" : ""
                }`}
                aria-invalid={Boolean(form.formState.errors.message)}
                aria-describedby={
                  form.formState.errors.message
                    ? `feedback-message-erro-${candidato.id}`
                    : undefined
                }
              />
              {form.formState.errors.message && (
                <p
                  id={`feedback-message-erro-${candidato.id}`}
                  className="form-error"
                  role="alert"
                >
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>
          </div>
          <Button
            variante="secundaria"
            type="submit"
            className="mt-4 w-full sm:w-auto"
            disabled={feedback.isPending}
          >
            {feedback.isPending ? "Salvando retorno..." : "Registrar retorno"}
          </Button>
        </form>
      )}
    </article>
  );
}

function ResumoPerfil({ perfil }: { perfil: CompanyCandidateProfile }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-brand-dark">
            {perfil.full_name}
          </h3>
          {perfil.headline && (
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {perfil.headline}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {[perfil.city, perfil.state].filter(Boolean).join(", ")}
          </p>
          {perfil.phone && (
            <p className="mt-1 text-xs text-slate-500">
              Telefone: {perfil.phone}
            </p>
          )}
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-dark">
          Perfil {perfil.completion_percentage}% preenchido
        </span>
      </div>
      {perfil.summary && (
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">
          {perfil.summary}
        </p>
      )}
      {(perfil.portfolio_url || perfil.linkedin_url || perfil.github_url) && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-brand">
          {perfil.portfolio_url && (
            <a href={perfil.portfolio_url} target="_blank" rel="noreferrer">
              Portfólio
            </a>
          )}
          {perfil.linkedin_url && (
            <a href={perfil.linkedin_url} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          )}
          {perfil.github_url && (
            <a href={perfil.github_url} target="_blank" rel="noreferrer">
              GitHub
            </a>
          )}
        </div>
      )}

      {perfil.experiences.length > 0 && (
        <ListaResumo
          titulo="Experiência"
          itens={perfil.experiences.map((item) => ({
            id: item.id,
            titulo: item.job_title,
            subtitulo: item.company_name,
            descricao: item.description,
            periodo: `${formatarData(item.start_date)} – ${
              item.is_current
                ? "atual"
                : item.end_date
                  ? formatarData(item.end_date)
                  : "não informado"
            }`,
          }))}
        />
      )}
      {perfil.educations.length > 0 && (
        <ListaResumo
          titulo="Formação"
          itens={perfil.educations.map((item) => ({
            id: item.id,
            titulo: item.course,
            subtitulo: `${item.institution} · ${item.degree_level}`,
            descricao: null,
            periodo: `${formatarData(item.start_date)}${
              item.end_date ? ` – ${formatarData(item.end_date)}` : ""
            }`,
          }))}
        />
      )}
      {perfil.skills.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Habilidades
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {perfil.skills.map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark"
              >
                {item.name}
                {item.proficiency ? ` · ${item.proficiency}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
      {perfil.languages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
            Idiomas
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {perfil.languages.map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark"
              >
                {item.name} · {item.proficiency}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ListaResumo({
  titulo,
  itens,
}: {
  titulo: string;
  itens: Array<{
    id: number;
    titulo: string;
    subtitulo: string;
    descricao: string | null;
    periodo: string;
  }>;
}) {
  return (
    <div className="mt-5">
      <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
        {titulo}
      </h4>
      <ul className="mt-2 space-y-3">
        {itens.map((item) => (
          <li key={item.id} className="border-l-2 border-brand/20 pl-3">
            <p className="text-sm font-bold text-brand-dark">{item.titulo}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">
              {item.subtitulo}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{item.periodo}</p>
            {item.descricao && (
              <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-600">
                {item.descricao}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
