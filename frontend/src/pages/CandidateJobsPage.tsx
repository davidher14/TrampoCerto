import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import {
  CandidatePage,
  CandidatePageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/CandidatePage";
import { JobCard } from "../components/JobCard";
import {
  buscarVagas,
  candidateQueryKeys,
  obterVagasSalvas,
} from "../lib/candidateApi";
import type {
  ContractType,
  JobSearchParams,
  WorkMode,
} from "../types/candidate";

const modos: WorkMode[] = ["onsite", "hybrid", "remote"];
const contratos: ContractType[] = [
  "clt",
  "pj",
  "internship",
  "temporary",
  "freelance",
  "apprentice",
];

const esquemaBusca = z
  .object({
    q: z.string().max(120, "Use até 120 caracteres."),
    city: z.string().max(100, "Use até 100 caracteres."),
    state: z.string().max(2, "Informe a sigla do estado."),
    work_mode: z.enum(["", ...modos]),
    contract_type: z.enum(["", ...contratos]),
    salary_min: z.string().refine(
      (valor) => !valor || (Number.isFinite(Number(valor)) && Number(valor) > 0),
      "Informe um salário mínimo válido.",
    ),
    salary_max: z.string().refine(
      (valor) => !valor || (Number.isFinite(Number(valor)) && Number(valor) > 0),
      "Informe um salário máximo válido.",
    ),
    order_by: z.enum(["recent", "salary_asc", "salary_desc"]),
  })
  .refine(
    ({ salary_min, salary_max }) =>
      !salary_min || !salary_max || Number(salary_max) >= Number(salary_min),
    {
      message: "O salário máximo deve ser igual ou maior que o mínimo.",
      path: ["salary_max"],
    },
  );

type DadosBusca = z.infer<typeof esquemaBusca>;

function parametroPositivo(valor: string | null): number | undefined {
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : undefined;
}

function paginaValida(valor: string | null): number {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : 1;
}

function eModalidade(valor: string | null): valor is WorkMode {
  return valor !== null && modos.includes(valor as WorkMode);
}

function eContrato(valor: string | null): valor is ContractType {
  return valor !== null && contratos.includes(valor as ContractType);
}

export function CandidateJobsPage() {
  const [parametrosUrl, setParametrosUrl] = useSearchParams();
  const pagina = paginaValida(parametrosUrl.get("page"));
  const modoUrl = parametrosUrl.get("work_mode");
  const contratoUrl = parametrosUrl.get("contract_type");
  const ordemUrl = parametrosUrl.get("order_by");
  const ordem =
    ordemUrl === "salary_asc" || ordemUrl === "salary_desc"
      ? ordemUrl
      : "recent";
  const minimo = parametroPositivo(parametrosUrl.get("salary_min"));
  const maximo = parametroPositivo(parametrosUrl.get("salary_max"));
  const filtros: JobSearchParams = {
    q: parametrosUrl.get("q") || undefined,
    city: parametrosUrl.get("city") || undefined,
    state: parametrosUrl.get("state") || undefined,
    work_mode: eModalidade(modoUrl) ? modoUrl : undefined,
    contract_type: eContrato(contratoUrl) ? contratoUrl : undefined,
    salary_min: minimo,
    salary_max: maximo,
    order_by: ordem,
    page: pagina,
    page_size: 12,
  };

  const vagas = useQuery({
    queryKey: [...candidateQueryKeys.jobs, filtros],
    queryFn: () => buscarVagas(filtros),
  });
  const salvas = useQuery({
    queryKey: candidateQueryKeys.savedJobs,
    queryFn: obterVagasSalvas,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DadosBusca>({
    resolver: zodResolver(esquemaBusca),
    defaultValues: {
      q: parametrosUrl.get("q") ?? "",
      city: parametrosUrl.get("city") ?? "",
      state: parametrosUrl.get("state") ?? "",
      work_mode: eModalidade(modoUrl) ? modoUrl : "",
      contract_type: eContrato(contratoUrl) ? contratoUrl : "",
      salary_min: parametrosUrl.get("salary_min") ?? "",
      salary_max: parametrosUrl.get("salary_max") ?? "",
      order_by: filtros.order_by,
    },
  });

  useEffect(() => {
    reset({
      q: parametrosUrl.get("q") ?? "",
      city: parametrosUrl.get("city") ?? "",
      state: parametrosUrl.get("state") ?? "",
      work_mode: eModalidade(modoUrl) ? modoUrl : "",
      contract_type: eContrato(contratoUrl) ? contratoUrl : "",
      salary_min: parametrosUrl.get("salary_min") ?? "",
      salary_max: parametrosUrl.get("salary_max") ?? "",
      order_by: filtros.order_by,
    });
  }, [parametrosUrl, reset]);

  const buscar = handleSubmit((dados) => {
    const novos: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(dados)) {
      if (valor && chave !== "state") novos[chave] = valor;
      if (chave === "state" && valor.trim()) {
        novos.state = valor.trim().toUpperCase();
      }
    }
    novos.page = "1";
    setParametrosUrl(novos);
  });

  const mudarPagina = (novaPagina: number) => {
    const proximos = Object.fromEntries(parametrosUrl.entries());
    proximos.page = String(novaPagina);
    setParametrosUrl(proximos);
  };

  return (
    <CandidatePage>
      <CandidatePageHeader
        eyebrow="Encontre sua próxima oportunidade"
        title="Buscar vagas"
        description="Todas as oportunidades abertas exibem a remuneração antes de você se candidatar."
      />

      <form
        onSubmit={buscar}
        noValidate
        className="mb-7 rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6"
      >
        <div className="mb-5 flex items-center gap-2 text-sm font-extrabold text-brand-dark">
          <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden="true" />
          Pesquise e filtre
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CampoFiltro
            label="Palavra-chave"
            erro={errors.q?.message}
            className="sm:col-span-2"
          >
            <input
              {...register("q")}
              placeholder="Cargo, habilidade ou área"
              className="form-input"
            />
          </CampoFiltro>
          <CampoFiltro label="Cidade" erro={errors.city?.message}>
            <input
              {...register("city")}
              placeholder="Ex.: Recife"
              className="form-input"
            />
          </CampoFiltro>
          <CampoFiltro label="Estado" erro={errors.state?.message}>
            <input
              {...register("state")}
              maxLength={2}
              placeholder="PE"
              className="form-input uppercase"
            />
          </CampoFiltro>
          <CampoFiltro label="Modalidade">
            <select {...register("work_mode")} className="form-input">
              <option value="">Todas</option>
              <option value="onsite">Presencial</option>
              <option value="hybrid">Híbrido</option>
              <option value="remote">Remoto</option>
            </select>
          </CampoFiltro>
          <CampoFiltro label="Contrato">
            <select {...register("contract_type")} className="form-input">
              <option value="">Todos</option>
              <option value="clt">CLT</option>
              <option value="pj">Pessoa jurídica</option>
              <option value="internship">Estágio</option>
              <option value="temporary">Temporário</option>
              <option value="freelance">Freelance</option>
              <option value="apprentice">Aprendiz</option>
            </select>
          </CampoFiltro>
          <CampoFiltro
            label="Salário mínimo (R$)"
            erro={errors.salary_min?.message}
          >
            <input
              {...register("salary_min")}
              inputMode="decimal"
              placeholder="Ex.: 3000"
              className="form-input"
            />
          </CampoFiltro>
          <CampoFiltro
            label="Salário máximo (R$)"
            erro={errors.salary_max?.message}
          >
            <input
              {...register("salary_max")}
              inputMode="decimal"
              placeholder="Ex.: 8000"
              className="form-input"
            />
          </CampoFiltro>
          <CampoFiltro label="Ordenar por">
            <select {...register("order_by")} className="form-input">
              <option value="recent">Mais recentes</option>
              <option value="salary_asc">Menor salário</option>
              <option value="salary_desc">Maior salário</option>
            </select>
          </CampoFiltro>
        </div>
        {minimo && maximo && maximo < minimo && (
          <p className="form-error" role="alert">
            O salário máximo deve ser igual ou maior que o mínimo.
          </p>
        )}
        {salvas.isError && (
          <p className="mt-4 text-sm text-amber-800" role="status">
            Não foi possível consultar suas vagas salvas. Os resultados da busca
            continuam disponíveis.
          </p>
        )}
        <button
          type="submit"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
        >
          Aplicar filtros
        </button>
      </form>

      {vagas.isPending ? (
        <LoadingState mensagem="Buscando vagas abertas..." />
      ) : vagas.isError ? (
        <ErrorState
          titulo="Não foi possível carregar as vagas."
          onRetry={() => void vagas.refetch()}
        />
      ) : vagas.data.items.length === 0 ? (
        <EmptyState
          titulo="Nenhuma vaga encontrada"
          descricao="Tente alterar a palavra-chave ou remover algum filtro para ampliar sua busca."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-600" aria-live="polite">
              {vagas.data.total}{" "}
              {vagas.data.total === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}
            </p>
            {vagas.isFetching && (
              <span className="text-xs font-medium text-slate-400" role="status">
                Atualizando resultados...
              </span>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {vagas.data.items.map((vaga) => (
              <JobCard
                key={vaga.id}
                vaga={vaga}
                salva={Boolean(salvas.data?.some((item) => item.id === vaga.id))}
              />
            ))}
          </div>
          {vagas.data.pages > 1 && (
            <nav
              className="mt-8 flex items-center justify-center gap-3"
              aria-label="Paginação das vagas"
            >
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => mudarPagina(pagina - 1)}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Anterior
              </button>
              <span className="text-sm font-semibold text-slate-600">
                {pagina} de {vagas.data.pages}
              </span>
              <button
                type="button"
                disabled={pagina >= vagas.data.pages}
                onClick={() => mudarPagina(pagina + 1)}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </CandidatePage>
  );
}

function CampoFiltro({
  label,
  erro,
  className = "",
  children,
}: {
  label: string;
  erro?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block">
        <span className="form-label">{label}</span>
        {children}
      </label>
      {erro && <p className="form-error">{erro}</p>}
    </div>
  );
}
