import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  FileUp,
  GraduationCap,
  Languages,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import {
  useFieldArray,
  useForm,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/Button";
import {
  CandidatePage,
  CandidatePageHeader,
  ErrorState,
  LoadingState,
} from "../components/CandidatePage";
import { useToast } from "../components/ToastProvider";
import {
  atualizarCurriculo,
  atualizarPerfilCandidato,
  candidateQueryKeys,
  enviarCurriculoPdf,
  obterPerfilCandidato,
} from "../lib/candidateApi";
import { obterMensagemErro } from "../lib/api";
import type {
  CandidateProfile,
  CandidateResumeInput,
} from "../types/candidate";

const urlOpcional = z.string().trim().refine(
  (valor) =>
    !valor ||
    (/^https?:\/\//i.test(valor) && z.url().safeParse(valor).success),
  "Informe uma URL válida com http:// ou https://.",
);

const esquemaPerfil = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo.").max(180),
  phone: z.string().trim().max(30, "Use até 30 caracteres."),
  city: z.string().trim().max(100, "Use até 100 caracteres."),
  state: z.string().trim().refine(
    (valor) => !valor || /^[a-z]{2}$/i.test(valor),
    "Informe a sigla de dois caracteres.",
  ),
  headline: z.string().trim().max(180, "Use até 180 caracteres."),
  summary: z.string().trim(),
  portfolio_url: urlOpcional,
  linkedin_url: urlOpcional,
  github_url: urlOpcional,
});

const dataOpcional = z.string().refine(
  (valor) => !valor || z.iso.date().safeParse(valor).success,
  "Informe uma data válida.",
);
const dataObrigatoria = z.string().refine(
  (valor) => z.iso.date().safeParse(valor).success,
  "Informe uma data inicial válida.",
);

const esquemaExperiencia = z
  .object({
    company_name: z.string().trim().min(1, "Informe a empresa.").max(180),
    job_title: z.string().trim().min(1, "Informe o cargo.").max(180),
    description: z.string(),
    start_date: dataObrigatoria,
    end_date: dataOpcional,
    is_current: z.boolean(),
  })
  .refine(
    (dados) =>
      dados.is_current ||
      !dados.end_date ||
      !dados.start_date ||
      dados.end_date >= dados.start_date,
    {
      message: "A data final deve ser posterior à data inicial.",
      path: ["end_date"],
    },
  );

const esquemaFormacao = z.object({
  institution: z.string().trim().min(1, "Informe a instituição.").max(180),
  course: z.string().trim().min(1, "Informe o curso.").max(180),
  degree_level: z.string().trim().min(1, "Informe o nível de formação.").max(80),
  start_date: dataObrigatoria,
  end_date: dataOpcional,
});

const esquemaHabilidade = z.object({
  name: z.string().trim().min(1, "Informe a habilidade.").max(100),
  proficiency: z.string().trim().max(40),
});

const esquemaIdioma = z.object({
  name: z.string().trim().min(1, "Informe o idioma.").max(100),
  proficiency: z.string().trim().min(1, "Informe o nível.").max(40),
});

const esquemaCurriculo = z.object({
  experiences: z.array(esquemaExperiencia),
  educations: z.array(esquemaFormacao),
  skills: z.array(esquemaHabilidade),
  languages: z.array(esquemaIdioma),
});

type DadosPerfil = z.infer<typeof esquemaPerfil>;
type DadosCurriculo = z.infer<typeof esquemaCurriculo>;

function dadosPessoais(perfil: CandidateProfile): DadosPerfil {
  return {
    full_name: perfil.full_name,
    phone: perfil.phone ?? "",
    city: perfil.city ?? "",
    state: perfil.state ?? "",
    headline: perfil.headline ?? "",
    summary: perfil.summary ?? "",
    portfolio_url: perfil.portfolio_url ?? "",
    linkedin_url: perfil.linkedin_url ?? "",
    github_url: perfil.github_url ?? "",
  };
}

function dadosCurriculo(perfil: CandidateProfile): DadosCurriculo {
  return {
    experiences: perfil.experiences.map(
      ({ company_name, job_title, description, start_date, end_date, is_current }) => ({
        company_name,
        job_title,
        description: description ?? "",
        start_date,
        end_date: end_date ?? "",
        is_current,
      }),
    ),
    educations: perfil.educations.map(
      ({ institution, course, degree_level, start_date, end_date }) => ({
        institution,
        course,
        degree_level,
        start_date,
        end_date: end_date ?? "",
      }),
    ),
    skills: perfil.skills.map(({ name, proficiency }) => ({
      name,
      proficiency: proficiency ?? "",
    })),
    languages: perfil.languages.map(({ name, proficiency }) => ({
      name,
      proficiency,
    })),
  };
}

export function CandidateProfilePage() {
  const perfil = useQuery({
    queryKey: candidateQueryKeys.profile,
    queryFn: obterPerfilCandidato,
  });

  if (perfil.isPending) return <LoadingState mensagem="Carregando seu currículo..." />;
  if (perfil.isError) {
    return (
      <CandidatePage largura="max-w-5xl">
        <ErrorState
          titulo="Não foi possível carregar seu currículo."
          onRetry={() => void perfil.refetch()}
        />
      </CandidatePage>
    );
  }

  return <EditorCurriculo perfil={perfil.data} />;
}

function EditorCurriculo({ perfil }: { perfil: CandidateProfile }) {
  const queryClient = useQueryClient();
  const { mostrarToast } = useToast();
  const arquivoRef = useRef<HTMLInputElement>(null);

  const dadosForm = useForm<DadosPerfil>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: dadosPessoais(perfil),
    mode: "onBlur",
  });
  const dadosLista = useForm<DadosCurriculo>({
    resolver: zodResolver(esquemaCurriculo),
    defaultValues: dadosCurriculo(perfil),
    mode: "onBlur",
  });

  const atualizarPessoa = useMutation({
    mutationFn: (dados: DadosPerfil) =>
      atualizarPerfilCandidato({
        full_name: dados.full_name.trim(),
        phone: dados.phone.trim() || null,
        city: dados.city.trim() || null,
        state: dados.state.trim().toUpperCase() || null,
        headline: dados.headline.trim() || null,
        summary: dados.summary.trim() || null,
        portfolio_url: dados.portfolio_url.trim() || null,
        linkedin_url: dados.linkedin_url.trim() || null,
        github_url: dados.github_url.trim() || null,
      }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(candidateQueryKeys.profile, atualizado);
      mostrarToast("Seus dados pessoais foram atualizados.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível salvar seus dados pessoais."),
        "erro",
      );
    },
  });

  const atualizarListas = useMutation({
    mutationFn: (dados: DadosCurriculo) => {
      const entrada: CandidateResumeInput = {
        experiences: dados.experiences.map((item) => ({
          company_name: item.company_name.trim(),
          job_title: item.job_title.trim(),
          description: item.description.trim() || null,
          start_date: item.start_date,
          end_date: item.is_current ? null : item.end_date || null,
          is_current: item.is_current,
        })),
        educations: dados.educations.map((item) => ({
          institution: item.institution.trim(),
          course: item.course.trim(),
          degree_level: item.degree_level.trim(),
          start_date: item.start_date,
          end_date: item.end_date || null,
        })),
        skills: dados.skills.map((item) => ({
          name: item.name.trim(),
          proficiency: item.proficiency.trim() || null,
        })),
        languages: dados.languages.map((item) => ({
          name: item.name.trim(),
          proficiency: item.proficiency.trim(),
        })),
      };
      return atualizarCurriculo(entrada);
    },
    onSuccess: (atualizado) => {
      queryClient.setQueryData(candidateQueryKeys.profile, atualizado);
      mostrarToast("Experiências, formação e habilidades foram salvas.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível salvar as seções do currículo."),
        "erro",
      );
    },
  });

  const enviarPdf = useMutation({
    mutationFn: enviarCurriculoPdf,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: candidateQueryKeys.profile,
      });
      mostrarToast("Currículo em PDF enviado com sucesso.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível enviar o arquivo PDF."),
        "erro",
      );
    },
  });

  const submeterPdf = (arquivo?: File) => {
    if (!arquivo) return;
    if (arquivo.type !== "application/pdf" || !arquivo.name.toLowerCase().endsWith(".pdf")) {
      mostrarToast("Selecione um arquivo PDF válido.", "erro");
      if (arquivoRef.current) arquivoRef.current.value = "";
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      mostrarToast("O arquivo deve ter no máximo 10 MB.", "erro");
      if (arquivoRef.current) arquivoRef.current.value = "";
      return;
    }
    enviarPdf.mutate(arquivo);
  };

  return (
    <CandidatePage largura="max-w-5xl">
      <CandidatePageHeader
        eyebrow="Currículo padronizado"
        title="Meu perfil profissional"
        description="Mantenha suas informações atualizadas. O mesmo formato ajuda recrutadores a conhecerem sua trajetória."
      />

      <section className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-extrabold text-brand-dark">
                Preenchimento do perfil
              </p>
              <span className="text-sm font-black text-brand">
                {perfil.completion_percentage}%
              </span>
            </div>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Preenchimento do perfil"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={perfil.completion_percentage}
            >
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${perfil.completion_percentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Complete as informações para apresentar seu perfil com mais
              contexto às empresas.
            </p>
          </div>
          <div className="rounded-2xl bg-brand-pale p-4 sm:max-w-xs">
            <p className="text-sm font-extrabold text-brand-dark">
              Currículo em PDF
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {perfil.has_resume
                ? "Seu PDF está anexado ao perfil."
                : "O envio é opcional; você também pode se candidatar com o perfil da plataforma."}
            </p>
            <input
              ref={arquivoRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              id="curriculo-pdf"
              onChange={(evento) => {
                submeterPdf(evento.target.files?.[0]);
                evento.target.value = "";
              }}
            />
            <label
              htmlFor="curriculo-pdf"
              className={`mt-3 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand/20 bg-white px-3 text-xs font-bold text-brand-dark transition hover:bg-white focus-within:outline focus-within:outline-2 focus-within:outline-brand ${
                enviarPdf.isPending ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              {enviarPdf.isPending
                ? "Enviando..."
                : perfil.has_resume
                  ? "Substituir PDF"
                  : "Enviar PDF"}
            </label>
          </div>
        </div>
      </section>

      <form
        onSubmit={dadosForm.handleSubmit((dados) => atualizarPessoa.mutate(dados))}
        noValidate
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7"
      >
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-brand-dark">
            Dados pessoais
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Informações básicas para contato e apresentação.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            id="perfil-nome"
            label="Nome completo"
            registro={dadosForm.register("full_name")}
            erro={dadosForm.formState.errors.full_name?.message}
            className="sm:col-span-2"
          />
          <Campo
            id="perfil-telefone"
            label="Telefone"
            registro={dadosForm.register("phone")}
            erro={dadosForm.formState.errors.phone?.message}
            autoComplete="tel"
          />
          <Campo
            id="perfil-titulo"
            label="Título profissional"
            registro={dadosForm.register("headline")}
            erro={dadosForm.formState.errors.headline?.message}
            placeholder="Ex.: Analista de dados"
          />
          <Campo
            id="perfil-cidade"
            label="Cidade"
            registro={dadosForm.register("city")}
            erro={dadosForm.formState.errors.city?.message}
            autoComplete="address-level2"
          />
          <Campo
            id="perfil-estado"
            label="Estado (UF)"
            registro={dadosForm.register("state")}
            erro={dadosForm.formState.errors.state?.message}
            maxLength={2}
            autoComplete="address-level1"
          />
          <Campo
            id="perfil-portfolio"
            label="Portfólio"
            registro={dadosForm.register("portfolio_url")}
            erro={dadosForm.formState.errors.portfolio_url?.message}
            type="url"
            placeholder="https://"
          />
          <Campo
            id="perfil-linkedin"
            label="LinkedIn"
            registro={dadosForm.register("linkedin_url")}
            erro={dadosForm.formState.errors.linkedin_url?.message}
            type="url"
            placeholder="https://linkedin.com/in/..."
          />
          <Campo
            id="perfil-github"
            label="GitHub"
            registro={dadosForm.register("github_url")}
            erro={dadosForm.formState.errors.github_url?.message}
            type="url"
            placeholder="https://github.com/..."
          />
          <div className="sm:col-span-2">
            <label htmlFor="perfil-resumo" className="form-label">
              Resumo profissional
            </label>
            <textarea
              {...dadosForm.register("summary")}
              id="perfil-resumo"
              rows={5}
              placeholder="Conte um pouco sobre sua experiência, seus objetivos e seus principais pontos fortes."
              className="form-input min-h-32 resize-y"
            />
          </div>
        </div>
        <Button
          variante="secundaria"
          type="submit"
          className="mt-5 w-full sm:w-auto"
          disabled={atualizarPessoa.isPending}
        >
          {atualizarPessoa.isPending ? "Salvando..." : "Salvar dados pessoais"}
        </Button>
      </form>

      <form
        onSubmit={dadosLista.handleSubmit((dados) =>
          atualizarListas.mutate(dados),
        )}
        noValidate
        className="mt-6 space-y-6"
      >
        <Experiencias form={dadosLista} />
        <Formacoes form={dadosLista} />
        <Habilidades form={dadosLista} />
        <Idiomas form={dadosLista} />
        {Object.keys(dadosLista.formState.errors).length > 0 && (
          <p className="text-sm font-medium text-red-700" role="alert">
            Revise os campos destacados antes de salvar o currículo.
          </p>
        )}
        <Button
          type="submit"
          larguraTotal
          disabled={atualizarListas.isPending}
        >
          {atualizarListas.isPending
            ? "Salvando currículo..."
            : "Salvar experiências, formação e habilidades"}
        </Button>
      </form>
    </CandidatePage>
  );
}

function Campo({
  id,
  label,
  registro,
  erro,
  className = "",
  type = "text",
  placeholder,
  maxLength,
  autoComplete,
}: {
  id: string;
  label: string;
  registro: UseFormRegisterReturn;
  erro?: string;
  className?: string;
  type?: "text" | "url" | "date";
  placeholder?: string;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        {...registro}
        id={id}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`form-input ${erro ? "form-input-error" : ""}`}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />
      {erro && (
        <p id={`${id}-erro`} className="form-error" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

function SectionHeader({
  icone: Icone,
  titulo,
  detalhe,
  onAdicionar,
  textoBotao,
}: {
  icone: LucideIcon;
  titulo: string;
  detalhe: string;
  onAdicionar: () => void;
  textoBotao: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand">
          <Icone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-brand-dark">{titulo}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detalhe}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAdicionar}
        className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-3 text-xs font-bold text-brand-dark transition hover:bg-brand-pale focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:self-auto"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {textoBotao}
      </button>
    </div>
  );
}

function RemoverLinha({
  onClick,
  rotulo,
}: {
  onClick: () => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function Experiencias({ form }: { form: ReturnType<typeof useForm<DadosCurriculo>> }) {
  const lista = useFieldArray({ control: form.control, name: "experiences" });

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7">
      <SectionHeader
        icone={BriefcaseBusiness}
        titulo="Experiência profissional"
        detalhe="Inclua suas experiências mais relevantes."
        textoBotao="Adicionar experiência"
        onAdicionar={() =>
          lista.append({
            company_name: "",
            job_title: "",
            description: "",
            start_date: "",
            end_date: "",
            is_current: false,
          })
        }
      />
      {lista.fields.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Nenhuma experiência adicionada.
        </p>
      )}
      <div className="space-y-4">
        {lista.fields.map((campo, indice) => (
          <div
            key={campo.id}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-brand-dark">
                Experiência {indice + 1}
              </p>
              <RemoverLinha
                rotulo={`Remover experiência ${indice + 1}`}
                onClick={() => lista.remove(indice)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                id={`experiencia-empresa-${indice}`}
                label="Empresa"
                registro={form.register(`experiences.${indice}.company_name`)}
                erro={form.formState.errors.experiences?.[indice]?.company_name?.message}
              />
              <Campo
                id={`experiencia-cargo-${indice}`}
                label="Cargo"
                registro={form.register(`experiences.${indice}.job_title`)}
                erro={form.formState.errors.experiences?.[indice]?.job_title?.message}
              />
              <Campo
                id={`experiencia-inicio-${indice}`}
                label="Data de início"
                type="date"
                registro={form.register(`experiences.${indice}.start_date`)}
                erro={form.formState.errors.experiences?.[indice]?.start_date?.message}
              />
              {!form.watch(`experiences.${indice}.is_current`) && (
                <Campo
                  id={`experiencia-fim-${indice}`}
                  label="Data de término"
                  registro={form.register(`experiences.${indice}.end_date`)}
                  erro={form.formState.errors.experiences?.[indice]?.end_date?.message}
                  type="date"
                />
              )}
              <label className="flex min-h-12 items-center gap-2 text-sm font-semibold text-slate-600 sm:col-span-2">
                <input
                  {...form.register(`experiences.${indice}.is_current`)}
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Trabalho atualmente nesta empresa
              </label>
              <div className="sm:col-span-2">
                <label
                  htmlFor={`experiencia-descricao-${indice}`}
                  className="form-label"
                >
                  Atividades e resultados
                </label>
                <textarea
                  {...form.register(`experiences.${indice}.description`)}
                  id={`experiencia-descricao-${indice}`}
                  rows={3}
                  className="form-input min-h-24 resize-y"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Formacoes({ form }: { form: ReturnType<typeof useForm<DadosCurriculo>> }) {
  const lista = useFieldArray({ control: form.control, name: "educations" });

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7">
      <SectionHeader
        icone={GraduationCap}
        titulo="Formação"
        detalhe="Registre seus cursos e instituições de ensino."
        textoBotao="Adicionar formação"
        onAdicionar={() =>
          lista.append({
            institution: "",
            course: "",
            degree_level: "",
            start_date: "",
            end_date: "",
          })
        }
      />
      {lista.fields.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Nenhuma formação adicionada.
        </p>
      )}
      <div className="space-y-4">
        {lista.fields.map((campo, indice) => (
          <div
            key={campo.id}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-brand-dark">
                Formação {indice + 1}
              </p>
              <RemoverLinha
                rotulo={`Remover formação ${indice + 1}`}
                onClick={() => lista.remove(indice)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                id={`formacao-instituicao-${indice}`}
                label="Instituição"
                registro={form.register(`educations.${indice}.institution`)}
                erro={form.formState.errors.educations?.[indice]?.institution?.message}
              />
              <Campo
                id={`formacao-curso-${indice}`}
                label="Curso"
                registro={form.register(`educations.${indice}.course`)}
                erro={form.formState.errors.educations?.[indice]?.course?.message}
              />
              <Campo
                id={`formacao-nivel-${indice}`}
                label="Nível de formação"
                registro={form.register(`educations.${indice}.degree_level`)}
                erro={form.formState.errors.educations?.[indice]?.degree_level?.message}
                placeholder="Ex.: Bacharelado"
              />
              <Campo
                id={`formacao-inicio-${indice}`}
                label="Data de início"
                registro={form.register(`educations.${indice}.start_date`)}
                erro={form.formState.errors.educations?.[indice]?.start_date?.message}
                type="date"
              />
              <Campo
                id={`formacao-fim-${indice}`}
                label="Data de término"
                registro={form.register(`educations.${indice}.end_date`)}
                erro={form.formState.errors.educations?.[indice]?.end_date?.message}
                type="date"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Habilidades({ form }: { form: ReturnType<typeof useForm<DadosCurriculo>> }) {
  const lista = useFieldArray({ control: form.control, name: "skills" });

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7">
      <SectionHeader
        icone={Wrench}
        titulo="Habilidades"
        detalhe="Liste ferramentas, conhecimentos e competências."
        textoBotao="Adicionar habilidade"
        onAdicionar={() => lista.append({ name: "", proficiency: "" })}
      />
      {lista.fields.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Nenhuma habilidade adicionada.
        </p>
      )}
      <div className="space-y-3">
        {lista.fields.map((campo, indice) => (
          <div
            key={campo.id}
            className="grid items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <Campo
              id={`habilidade-nome-${indice}`}
              label="Habilidade"
              registro={form.register(`skills.${indice}.name`)}
              erro={form.formState.errors.skills?.[indice]?.name?.message}
            />
            <Campo
              id={`habilidade-nivel-${indice}`}
              label="Nível (opcional)"
              registro={form.register(`skills.${indice}.proficiency`)}
              erro={form.formState.errors.skills?.[indice]?.proficiency?.message}
              placeholder="Ex.: Avançado"
            />
            <div className="flex justify-end sm:pt-6">
              <RemoverLinha
                rotulo={`Remover habilidade ${indice + 1}`}
                onClick={() => lista.remove(indice)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Idiomas({ form }: { form: ReturnType<typeof useForm<DadosCurriculo>> }) {
  const lista = useFieldArray({ control: form.control, name: "languages" });

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-7">
      <SectionHeader
        icone={Languages}
        titulo="Idiomas"
        detalhe="Informe os idiomas e seu nível de proficiência."
        textoBotao="Adicionar idioma"
        onAdicionar={() => lista.append({ name: "", proficiency: "" })}
      />
      {lista.fields.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Nenhum idioma adicionado.
        </p>
      )}
      <div className="space-y-3">
        {lista.fields.map((campo, indice) => (
          <div
            key={campo.id}
            className="grid items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <Campo
              id={`idioma-nome-${indice}`}
              label="Idioma"
              registro={form.register(`languages.${indice}.name`)}
              erro={form.formState.errors.languages?.[indice]?.name?.message}
              placeholder="Ex.: Inglês"
            />
            <Campo
              id={`idioma-nivel-${indice}`}
              label="Nível"
              registro={form.register(`languages.${indice}.proficiency`)}
              erro={form.formState.errors.languages?.[indice]?.proficiency?.message}
              placeholder="Ex.: Intermediário"
            />
            <div className="flex justify-end sm:pt-6">
              <RemoverLinha
                rotulo={`Remover idioma ${indice + 1}`}
                onClick={() => lista.remove(indice)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
