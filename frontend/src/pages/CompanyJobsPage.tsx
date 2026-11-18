import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Pencil,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import {
  CompanyEmpty,
  CompanyError,
  CompanyLoading,
  CompanyPage,
  CompanyPageHeader,
} from "../components/CompanyPage";
import { useToast } from "../components/ToastProvider";
import {
  companyQueryKeys,
  encerrarVagaEmpresa,
  excluirVagaEmpresa,
  listarVagasEmpresa,
  obterPendenciasEncerramento,
  publicarVagaEmpresa,
} from "../lib/companyApi";
import { obterMensagemErro } from "../lib/api";
import { formatarSalario, nomeContrato, nomeModalidade } from "../lib/candidateFormat";
import type { Job } from "../types/candidate";
import type { PendingCandidate } from "../types/company";

type FiltroVagas = "todas" | "open" | "draft" | "closed";

export function CompanyJobsPage() {
  const queryClient = useQueryClient();
  const { mostrarToast } = useToast();
  const [filtro, setFiltro] = useState<FiltroVagas>("todas");
  const [vagaParaEncerrar, setVagaParaEncerrar] = useState<Job | null>(null);
  const [pendencias, setPendencias] = useState<PendingCandidate[]>([]);
  const [vagaParaExcluir, setVagaParaExcluir] = useState<Job | null>(null);

  const vagas = useQuery({
    queryKey: companyQueryKeys.jobs,
    queryFn: listarVagasEmpresa,
  });

  const invalidarVagas = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.jobs }),
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.dashboard }),
    ]);
  };

  const publicar = useMutation({
    mutationFn: publicarVagaEmpresa,
    onSuccess: async () => {
      await invalidarVagas();
      mostrarToast("Vaga publicada e disponível para candidaturas.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(obterMensagemErro(erro, "Não foi possível publicar a vaga."), "erro");
    },
  });

  const encerrar = useMutation({
    mutationFn: encerrarVagaEmpresa,
    onSuccess: async () => {
      await invalidarVagas();
      setVagaParaEncerrar(null);
      setPendencias([]);
      mostrarToast("Vaga encerrada com sucesso.", "sucesso");
    },
    onError: (erro) => {
      const candidatos = obterPendenciasEncerramento(erro);
      if (candidatos.length) {
        setPendencias(candidatos);
        return;
      }
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível encerrar a vaga."),
        "erro",
      );
    },
  });

  const excluir = useMutation({
    mutationFn: excluirVagaEmpresa,
    onSuccess: async () => {
      await invalidarVagas();
      setVagaParaExcluir(null);
      mostrarToast("Vaga removida.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível remover a vaga."),
        "erro",
      );
    },
  });

  if (vagas.isPending) {
    return <CompanyLoading mensagem="Carregando suas vagas..." />;
  }
  if (vagas.isError) {
    return (
      <CompanyPage>
        <CompanyError
          titulo="Não foi possível carregar suas vagas."
          onRetry={() => void vagas.refetch()}
        />
      </CompanyPage>
    );
  }

  const lista = vagas.data.items.filter(
    (vaga) => filtro === "todas" || vaga.status === filtro,
  );
  const filtros: { id: FiltroVagas; label: string }[] = [
    { id: "todas", label: `Todas (${vagas.data.total})` },
    {
      id: "open",
      label: `Abertas (${vagas.data.items.filter((vaga) => vaga.status === "open").length})`,
    },
    {
      id: "draft",
      label: `Rascunhos (${vagas.data.items.filter((vaga) => vaga.status === "draft").length})`,
    },
    {
      id: "closed",
      label: `Encerradas (${vagas.data.items.filter((vaga) => vaga.status === "closed").length})`,
    },
  ];

  return (
    <CompanyPage>
      <CompanyPageHeader
        eyebrow="Gestão de oportunidades"
        title="Minhas vagas"
        description="Acompanhe publicações e candidaturas. Toda vaga precisa informar salário, e cada candidato deve receber retorno."
      >
        <Link
          to="/empresa/vagas/nova"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
        >
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Criar vaga
        </Link>
      </CompanyPageHeader>

      <div
        className="mb-6 flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Filtrar vagas por status"
      >
        {filtros.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filtro === id}
            onClick={() => setFiltro(id)}
            className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
              filtro === id
                ? "bg-brand-dark text-white"
                : "bg-white text-slate-600 hover:bg-brand-pale"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <CompanyEmpty
          titulo={
            filtro === "todas"
              ? "Você ainda não publicou vagas"
              : "Nenhuma vaga nesta categoria"
          }
          descricao="Publique sua oportunidade com remuneração clara e acompanhe todas as etapas do processo."
        >
          <Link
            to="/empresa/vagas/nova"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-blue-700"
          >
            <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
            Publicar vaga
          </Link>
        </CompanyEmpty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((vaga) => (
            <article
              key={vaga.id}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand">{vaga.area}</p>
                  <h2 className="mt-1 text-xl font-extrabold leading-snug text-brand-dark">
                    {vaga.title}
                  </h2>
                </div>
                <StatusVaga status={vaga.status} />
              </div>

              <div className="mt-4 rounded-2xl bg-brand-pale p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Salário informado
                </p>
                <p className="mt-1 text-lg font-black text-brand-dark">
                  {formatarSalario(
                    vaga.salary_min,
                    vaga.salary_max,
                    vaga.salary_currency,
                  )}
                </p>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                {vaga.city}, {vaga.state} · {nomeModalidade(vaga.work_mode)} ·{" "}
                {nomeContrato(vaga.contract_type)}
              </p>
              <p className="mt-3 line-clamp-2 whitespace-pre-line text-sm leading-6 text-slate-500">
                {vaga.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Link
                  to={`/empresa/vagas/${vaga.id}/candidatos`}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand-pale px-3 text-xs font-bold text-brand-dark transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <UsersRound className="h-4 w-4" aria-hidden="true" />
                  Candidatos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {vaga.status !== "closed" && (
                  <Link
                    to={`/empresa/vagas/${vaga.id}/editar`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Editar
                  </Link>
                )}
                {vaga.status === "draft" && (
                  <Button
                    variante="secundaria"
                    className="min-h-10 px-3 py-2 text-xs"
                    disabled={publicar.isPending}
                    onClick={() => publicar.mutate(vaga.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Publicar
                  </Button>
                )}
                {vaga.status === "open" && (
                  <Button
                    variante="secundaria"
                    className="min-h-10 px-3 py-2 text-xs"
                    onClick={() => {
                      setVagaParaEncerrar(vaga);
                      setPendencias([]);
                    }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Encerrar
                  </Button>
                )}
                {vaga.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => setVagaParaExcluir(vaga)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Excluir
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {vagaParaEncerrar && (
        <DialogoConfirmacao
          titulo={
            pendencias.length
              ? "Ainda há candidatos sem retorno"
              : "Encerrar esta vaga?"
          }
          descricao={
            pendencias.length
              ? "Para proteger quem participou, primeiro registre um retorno para cada pessoa abaixo. A vaga continua aberta."
              : `Ao encerrar “${vagaParaEncerrar.title}”, ela não receberá novas candidaturas. Esta ação só será concluída se todos os candidatos já tiverem recebido retorno.`
          }
          busy={encerrar.isPending}
          textoConfirmacao="Encerrar vaga"
          somenteAviso={pendencias.length > 0}
          onCancel={() => {
            setVagaParaEncerrar(null);
            setPendencias([]);
          }}
          onConfirm={() => encerrar.mutate(vagaParaEncerrar.id)}
        >
          {pendencias.length > 0 && (
            <ul className="max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
              {pendencias.map((candidato) => (
                <li
                  key={candidato.application_id}
                  className="border-b border-amber-200 pb-2 last:border-b-0 last:pb-0"
                >
                  <p className="font-bold">{candidato.name}</p>
                  <p className="break-all text-xs">{candidato.email}</p>
                </li>
              ))}
            </ul>
          )}
        </DialogoConfirmacao>
      )}

      {vagaParaExcluir && (
        <DialogoConfirmacao
          titulo="Excluir esta vaga?"
          descricao={`A vaga “${vagaParaExcluir.title}” será removida. Se ela tiver candidaturas, o histórico será preservado e a API bloqueará a exclusão.`}
          busy={excluir.isPending}
          textoConfirmacao="Excluir vaga"
          perigo
          onCancel={() => setVagaParaExcluir(null)}
          onConfirm={() => excluir.mutate(vagaParaExcluir.id)}
        />
      )}
    </CompanyPage>
  );
}

function StatusVaga({ status }: { status: string }) {
  const aberto = status === "open";
  const fechado = status === "closed";
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${
        aberto
          ? "bg-emerald-50 text-emerald-800"
          : fechado
            ? "bg-slate-100 text-slate-600"
            : "bg-amber-50 text-amber-800"
      }`}
    >
      {aberto ? "Aberta" : fechado ? "Encerrada" : "Rascunho"}
    </span>
  );
}

function DialogoConfirmacao({
  titulo,
  descricao,
  children,
  textoConfirmacao,
  busy,
  perigo = false,
  somenteAviso = false,
  onCancel,
  onConfirm,
}: {
  titulo: string;
  descricao: string;
  children?: React.ReactNode;
  textoConfirmacao: string;
  busy: boolean;
  perigo?: boolean;
  somenteAviso?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-brand-dark/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCancel();
      }}
    >
      <section
        role={somenteAviso ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-descricao"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <h2 id="dialogo-titulo" className="text-xl font-black text-brand-dark">
          {titulo}
        </h2>
        <p
          id="dialogo-descricao"
          className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600"
        >
          {descricao}
        </p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variante="secundaria"
            disabled={busy}
            onClick={onCancel}
          >
            {somenteAviso ? "Entendi" : "Cancelar"}
          </Button>
          {!somenteAviso && (
            <Button
              className={perigo ? "bg-red-700 shadow-red-700/20 hover:bg-red-800" : ""}
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? "Aguarde..." : textoConfirmacao}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
