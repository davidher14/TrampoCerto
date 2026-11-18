import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CircleDollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/Button";
import {
  CompanyError,
  CompanyLoading,
  CompanyPage,
  CompanyPageHeader,
} from "../components/CompanyPage";
import { useToast } from "../components/ToastProvider";
import {
  atualizarVagaEmpresa,
  companyQueryKeys,
  criarVagaEmpresa,
  listarVagasEmpresa,
} from "../lib/companyApi";
import { obterMensagemErro } from "../lib/api";
import type { Job } from "../types/candidate";
import type { CompanyJobInput } from "../types/company";

const salarioSchema = z
  .string()
  .trim()
  .min(1, "Informe o salário. Não é permitido publicar “a combinar”.")
  .regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um valor válido, com até duas casas decimais.")
  .refine((valor) => Number(valor.replace(",", ".")) > 0, "O salário deve ser maior que zero.");

const esquemaVaga = z
  .object({
    title: z.string().trim().min(2, "Informe um título com pelo menos 2 caracteres.").max(180),
    area: z.string().trim().min(1, "Informe a área.").max(100),
    description: z.string().trim().min(1, "Descreva a oportunidade."),
    requirements: z.string().trim().min(1, "Informe os requisitos."),
    city: z.string().trim().min(1, "Informe a cidade.").max(100),
    state: z.string().trim().regex(/^[a-z]{2}$/i, "Informe a sigla de dois caracteres."),
    work_mode: z.enum(["onsite", "hybrid", "remote"]),
    contract_type: z.enum([
      "clt",
      "pj",
      "internship",
      "temporary",
      "freelance",
      "apprentice",
    ]),
    salary_min: salarioSchema,
    salary_max: z.string().trim().refine(
      (valor) =>
        !valor ||
        (/^\d+(?:[.,]\d{1,2})?$/.test(valor) &&
          Number(valor.replace(",", ".")) > 0),
      "Informe um salário máximo válido.",
    ),
    status: z.enum(["draft", "open"]),
  })
  .refine(
    (dados) =>
      !dados.salary_max ||
      Number(dados.salary_max.replace(",", ".")) >=
        Number(dados.salary_min.replace(",", ".")),
    {
      message: "O salário máximo não pode ser menor que o mínimo.",
      path: ["salary_max"],
    },
  );

type DadosVaga = z.infer<typeof esquemaVaga>;

const vagaVazia: DadosVaga = {
  title: "",
  area: "",
  description: "",
  requirements: "",
  city: "",
  state: "",
  work_mode: "onsite",
  contract_type: "clt",
  salary_min: "",
  salary_max: "",
  status: "draft",
};

function valorSalario(valor: number | string | null): string {
  return valor === null ? "" : String(valor);
}

function valoresVaga(vaga: Job): DadosVaga {
  return {
    title: vaga.title,
    area: vaga.area,
    description: vaga.description,
    requirements: vaga.requirements,
    city: vaga.city,
    state: vaga.state,
    work_mode: vaga.work_mode,
    contract_type: vaga.contract_type,
    salary_min: valorSalario(vaga.salary_min),
    salary_max: valorSalario(vaga.salary_max),
    status: vaga.status === "open" ? "open" : "draft",
  };
}

function converterEntrada(dados: DadosVaga): CompanyJobInput {
  const salaryMin = Number(dados.salary_min.replace(",", "."));
  const salaryMax = dados.salary_max
    ? Number(dados.salary_max.replace(",", "."))
    : null;
  return {
    title: dados.title.trim(),
    area: dados.area.trim(),
    description: dados.description.trim(),
    requirements: dados.requirements.trim(),
    city: dados.city.trim(),
    state: dados.state.trim().toUpperCase(),
    work_mode: dados.work_mode,
    contract_type: dados.contract_type,
    salary_min: salaryMin,
    salary_max: salaryMax,
    status: dados.status,
  };
}

export function CompanyJobFormPage() {
  const { jobId: jobIdParam } = useParams();
  const editando = jobIdParam !== undefined;
  const jobId = Number(jobIdParam);
  const vagas = useQuery({
    queryKey: companyQueryKeys.jobs,
    queryFn: listarVagasEmpresa,
    enabled: editando,
  });

  if (editando) {
    if (!Number.isSafeInteger(jobId) || jobId <= 0) {
      return (
        <CompanyPage largura="max-w-3xl">
          <CompanyError titulo="O endereço desta vaga é inválido." />
        </CompanyPage>
      );
    }
    if (vagas.isPending) {
      return <CompanyLoading mensagem="Carregando os dados da vaga..." />;
    }
    if (vagas.isError) {
      return (
        <CompanyPage largura="max-w-3xl">
          <CompanyError
            titulo="Não foi possível carregar os dados da vaga."
            onRetry={() => void vagas.refetch()}
          />
        </CompanyPage>
      );
    }
    const vaga = vagas.data.items.find((item) => item.id === jobId);
    if (!vaga) {
      return (
        <CompanyPage largura="max-w-3xl">
          <CompanyError titulo="Esta vaga não foi encontrada na sua lista." />
        </CompanyPage>
      );
    }
    if (vaga.status === "closed") {
      return (
        <CompanyPage largura="max-w-3xl">
          <CompanyError titulo="Vagas encerradas não podem ser alteradas." />
        </CompanyPage>
      );
    }
    return <FormularioVaga key={vaga.id} vaga={vaga} />;
  }

  return <FormularioVaga key="nova" />;
}

function FormularioVaga({ vaga }: { vaga?: Job }) {
  const queryClient = useQueryClient();
  const navegar = useNavigate();
  const { mostrarToast } = useToast();
  const editar = vaga !== undefined;
  const formulario = useForm<DadosVaga>({
    resolver: zodResolver(esquemaVaga),
    defaultValues: vaga ? valoresVaga(vaga) : vagaVazia,
    mode: "onBlur",
  });

  const mutacao = useMutation({
    mutationFn: (dados: DadosVaga) => {
      const entrada = converterEntrada(dados);
      return editar
        ? atualizarVagaEmpresa(vaga.id, entrada)
        : criarVagaEmpresa(entrada);
    },
    onSuccess: async (vagaSalva) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.jobs }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.dashboard }),
      ]);
      mostrarToast(
        editar
          ? "Vaga atualizada com sucesso."
          : vagaSalva.status === "open"
            ? "Vaga publicada com sucesso."
            : "Rascunho salvo. Você poderá publicar quando estiver pronta.",
        "sucesso",
      );
      navegar("/empresa/vagas", { replace: true });
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível salvar a vaga."),
        "erro",
      );
    },
  });

  const errors = formulario.formState.errors;

  return (
    <CompanyPage largura="max-w-4xl">
      <Link
        to="/empresa/vagas"
        className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar às vagas
      </Link>
      <CompanyPageHeader
        eyebrow={editar ? "Gestão de oportunidade" : "Nova oportunidade"}
        title={editar ? "Editar vaga" : "Publicar vaga"}
        description="A remuneração é obrigatória para publicação. Seja claro sobre a oportunidade e seus requisitos."
      />

      <form
        onSubmit={formulario.handleSubmit((dados) => mutacao.mutate(dados))}
        noValidate
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo
            id="vaga-titulo"
            label="Título da vaga"
            erro={errors.title?.message}
            className="sm:col-span-2"
          >
            <input
              {...formulario.register("title")}
              id="vaga-titulo"
              maxLength={180}
              placeholder="Ex.: Analista de dados pleno"
              className={classeCampo(errors.title)}
            />
          </Campo>
          <Campo id="vaga-area" label="Área" erro={errors.area?.message}>
            <input
              {...formulario.register("area")}
              id="vaga-area"
              maxLength={100}
              placeholder="Ex.: Tecnologia"
              className={classeCampo(errors.area)}
            />
          </Campo>
          <Campo id="vaga-contrato" label="Tipo de contrato">
            <select
              {...formulario.register("contract_type")}
              id="vaga-contrato"
              className="form-input"
            >
              <option value="clt">CLT</option>
              <option value="pj">Pessoa jurídica</option>
              <option value="internship">Estágio</option>
              <option value="temporary">Temporário</option>
              <option value="freelance">Freelance</option>
              <option value="apprentice">Aprendiz</option>
            </select>
          </Campo>
          <Campo id="vaga-cidade" label="Cidade" erro={errors.city?.message}>
            <input
              {...formulario.register("city")}
              id="vaga-cidade"
              maxLength={100}
              autoComplete="address-level2"
              className={classeCampo(errors.city)}
            />
          </Campo>
          <Campo id="vaga-estado" label="Estado (UF)" erro={errors.state?.message}>
            <input
              {...formulario.register("state")}
              id="vaga-estado"
              maxLength={2}
              autoComplete="address-level1"
              placeholder="PE"
              className={classeCampo(errors.state)}
            />
          </Campo>
          <Campo id="vaga-modalidade" label="Modalidade">
            <select
              {...formulario.register("work_mode")}
              id="vaga-modalidade"
              className="form-input"
            >
              <option value="onsite">Presencial</option>
              <option value="hybrid">Híbrido</option>
              <option value="remote">Remoto</option>
            </select>
          </Campo>
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <Campo
              id="vaga-salario-min"
              label="Salário mínimo (R$)"
              erro={errors.salary_min?.message}
            >
              <input
                {...formulario.register("salary_min")}
                id="vaga-salario-min"
                inputMode="decimal"
                placeholder="Ex.: 4500"
                className={classeCampo(errors.salary_min)}
              />
            </Campo>
            <Campo
              id="vaga-salario-max"
              label="Salário máximo (R$)"
              erro={errors.salary_max?.message}
            >
              <input
                {...formulario.register("salary_max")}
                id="vaga-salario-max"
                inputMode="decimal"
                placeholder="Opcional"
                className={classeCampo(errors.salary_max)}
              />
            </Campo>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-brand-pale p-4 sm:col-span-2">
            <CircleDollarSign
              className="mt-0.5 h-5 w-5 shrink-0 text-brand"
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-brand-dark">
              Informe uma remuneração real. O campo é obrigatório: não é
              permitido publicar “a combinar”.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Campo
              id="vaga-descricao"
              label="Descrição da vaga"
              erro={errors.description?.message}
            >
              <textarea
                {...formulario.register("description")}
                id="vaga-descricao"
                rows={7}
                placeholder="Apresente a missão da vaga, responsabilidades, benefícios e contexto do time."
                className={`form-input min-h-40 resize-y ${
                  errors.description ? "form-input-error" : ""
                }`}
              />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo
              id="vaga-requisitos"
              label="Requisitos"
              erro={errors.requirements?.message}
            >
              <textarea
                {...formulario.register("requirements")}
                id="vaga-requisitos"
                rows={6}
                placeholder="Liste conhecimentos e experiências essenciais para a função."
                className={`form-input min-h-36 resize-y ${
                  errors.requirements ? "form-input-error" : ""
                }`}
              />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo id="vaga-status" label="Publicação">
              <select
                {...formulario.register("status")}
                id="vaga-status"
                disabled={editar && vaga.status === "open"}
                className="form-input disabled:bg-slate-100"
              >
                <option value="draft">Salvar como rascunho</option>
                <option value="open">Publicar para receber candidaturas</option>
              </select>
              {editar && vaga.status === "open" && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  A vaga está aberta. O status é alterado pelo botão de
                  encerramento, que exige retorno a todos os candidatos.
                </p>
              )}
            </Campo>
          </div>
        </div>
        <Button
          type="submit"
          larguraTotal
          disabled={mutacao.isPending}
          className="mt-7"
        >
          {mutacao.isPending
            ? "Salvando..."
            : editar
              ? "Salvar alterações"
              : formulario.watch("status") === "open"
                ? "Publicar vaga"
                : "Salvar rascunho"}
        </Button>
      </form>
    </CompanyPage>
  );
}

function Campo({
  id,
  label,
  erro,
  className = "",
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} className="form-error" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

function classeCampo(erro?: { message?: string }): string {
  return `form-input ${erro ? "form-input-error" : ""}`;
}
