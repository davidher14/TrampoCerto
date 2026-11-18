import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, FileImage, Globe2, ImagePlus } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/Button";
import {
  CompanyError,
  CompanyLoading,
  CompanyPage,
  CompanyPageHeader,
} from "../components/CompanyPage";
import { useToast } from "../components/ToastProvider";
import { obterMensagemErro } from "../lib/api";
import {
  atualizarPerfilEmpresa,
  companyQueryKeys,
  enviarLogoEmpresa,
  obterPerfilEmpresa,
} from "../lib/companyApi";
import type { CompanyProfile } from "../types/company";

const urlOpcional = z.string().trim().refine(
  (valor) =>
    !valor ||
    (/^https?:\/\//i.test(valor) && z.url().safeParse(valor).success),
  "Informe uma URL válida com http:// ou https://.",
);

const esquemaEmpresa = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(180),
  description: z.string().trim(),
  website: urlOpcional,
});

type DadosEmpresa = z.infer<typeof esquemaEmpresa>;

export function CompanyProfilePage() {
  const perfil = useQuery({
    queryKey: companyQueryKeys.profile,
    queryFn: obterPerfilEmpresa,
  });

  if (perfil.isPending) return <CompanyLoading mensagem="Carregando perfil da empresa..." />;
  if (perfil.isError) {
    return (
      <CompanyPage largura="max-w-4xl">
        <CompanyError
          titulo="Não foi possível carregar o perfil da empresa."
          onRetry={() => void perfil.refetch()}
        />
      </CompanyPage>
    );
  }

  return <EditorPerfilEmpresa perfil={perfil.data} />;
}

function EditorPerfilEmpresa({
  perfil,
}: {
  perfil: CompanyProfile;
}) {
  const queryClient = useQueryClient();
  const { mostrarToast } = useToast();
  const arquivoRef = useRef<HTMLInputElement>(null);
  const formulario = useForm<DadosEmpresa>({
    resolver: zodResolver(esquemaEmpresa),
    defaultValues: {
      name: perfil.name,
      description: perfil.description ?? "",
      website: perfil.website ?? "",
    },
    mode: "onBlur",
  });

  const salvar = useMutation({
    mutationFn: (dados: DadosEmpresa) =>
      atualizarPerfilEmpresa({
        name: dados.name.trim(),
        description: dados.description.trim() || null,
        website: dados.website.trim() || null,
      }),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(companyQueryKeys.profile, atualizado);
      mostrarToast("Perfil da empresa atualizado.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível salvar o perfil."),
        "erro",
      );
    },
  });

  const logo = useMutation({
    mutationFn: enviarLogoEmpresa,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: companyQueryKeys.profile,
      });
      mostrarToast("Logo atualizado com sucesso.", "sucesso");
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível enviar o logo."),
        "erro",
      );
    },
  });

  const escolherLogo = (arquivo?: File) => {
    if (!arquivo) return;
    const tipoValido = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ].includes(arquivo.type);
    if (!tipoValido || arquivo.size > 10 * 1024 * 1024) {
      mostrarToast(
        "Escolha uma imagem PNG, JPG ou WEBP com até 10 MB.",
        "erro",
      );
      if (arquivoRef.current) arquivoRef.current.value = "";
      return;
    }
    logo.mutate(arquivo);
  };

  const errors = formulario.formState.errors;

  return (
    <CompanyPage largura="max-w-4xl">
      <CompanyPageHeader
        eyebrow="Identidade da empresa"
        title="Perfil da empresa"
        description="Ajude os candidatos a conhecerem sua organização com informações claras e atuais."
      />

      <div className="mb-6 grid gap-5 md:grid-cols-[auto_1fr]">
        <div className="grid min-h-40 min-w-40 place-items-center overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-card">
          {perfil.logo_url ? (
            <img
              src={perfil.logo_url}
              alt={`Logo da empresa ${perfil.name}`}
              className="max-h-32 max-w-48 object-contain"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-pale text-brand">
              <Building2 className="h-8 w-8" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-pale text-brand">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-extrabold text-brand-dark">Logo da empresa</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Use uma imagem PNG, JPG ou WEBP de até 10 MB.
              </p>
            </div>
          </div>
          <input
            ref={arquivoRef}
            id="logo-empresa"
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="sr-only"
            onChange={(evento) => {
              escolherLogo(evento.target.files?.[0]);
              evento.target.value = "";
            }}
          />
          <label
            htmlFor="logo-empresa"
            className={`mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-brand-dark transition hover:bg-brand-pale focus-within:outline focus-within:outline-2 focus-within:outline-brand ${
              logo.isPending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <FileImage className="h-4 w-4" aria-hidden="true" />
            {logo.isPending
              ? "Enviando..."
              : perfil.has_logo
                ? "Substituir logo"
                : "Enviar logo"}
          </label>
        </div>
      </div>

      <form
        onSubmit={formulario.handleSubmit((dados) => salvar.mutate(dados))}
        noValidate
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card sm:p-8"
      >
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-brand-dark">
            Informações públicas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            O CNPJ é mantido conforme os dados do cadastro.
          </p>
        </div>
        <div className="space-y-5">
          <Campo
            id="empresa-nome"
            label="Nome da empresa"
            erro={errors.name?.message}
          >
            <input
              {...formulario.register("name")}
              id="empresa-nome"
              maxLength={180}
              autoComplete="organization"
              className={`form-input ${errors.name ? "form-input-error" : ""}`}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "empresa-nome-erro" : undefined}
            />
          </Campo>
          <div>
            <label htmlFor="empresa-cnpj" className="form-label">
              CNPJ
            </label>
            <input
              id="empresa-cnpj"
              value={perfil.cnpj}
              readOnly
              className="form-input bg-slate-50 text-slate-500"
            />
            <p className="mt-2 text-xs text-slate-500">
              Para manter a segurança do cadastro, o CNPJ não pode ser alterado
              por esta tela.
            </p>
          </div>
          <div>
            <label
              htmlFor="empresa-site"
              className="form-label flex items-center gap-2"
            >
              <Globe2 className="h-4 w-4 text-brand" aria-hidden="true" />
              Site
            </label>
            <input
              {...formulario.register("website")}
              id="empresa-site"
              type="url"
              placeholder="https://suaempresa.com.br"
              className={`form-input ${errors.website ? "form-input-error" : ""}`}
              aria-invalid={Boolean(errors.website)}
              aria-describedby={
                errors.website ? "empresa-site-erro" : undefined
              }
            />
            {errors.website && (
              <p id="empresa-site-erro" className="form-error" role="alert">
                {errors.website.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="empresa-descricao" className="form-label">
              Sobre a empresa
            </label>
            <textarea
              {...formulario.register("description")}
              id="empresa-descricao"
              rows={7}
              placeholder="Conte aos candidatos sobre a missão, a cultura e o que torna sua empresa especial."
              className="form-input min-h-40 resize-y"
            />
          </div>
        </div>
        <Button
          type="submit"
          larguraTotal
          className="mt-6 sm:w-auto"
          disabled={salvar.isPending}
        >
          {salvar.isPending ? "Salvando..." : "Salvar perfil"}
        </Button>
      </form>
    </CompanyPage>
  );
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
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
