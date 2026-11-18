import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { PasswordField } from "../components/PasswordField";
import { useToast } from "../components/ToastProvider";
import { obterMensagemErro } from "../lib/api";

const senhaSchema = z
  .string()
  .min(10, "Use pelo menos 10 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.")
  .regex(/\p{L}/u, "Inclua pelo menos uma letra.")
  .regex(/[0-9]/, "Inclua pelo menos um número.");

const esquemaCandidato = z
  .object({
    full_name: z.string().trim().min(2, "Informe seu nome completo."),
    email: z.string().trim().email("Informe um e-mail válido."),
    password: senhaSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((dados) => dados.password === dados.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

const pesosCnpjPrimeiro = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const pesosCnpjSegundo = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calcularDigitoCnpj(base: string, pesos: number[]): string {
  const soma = [...base].reduce(
    (total, numero, indice) => total + Number(numero) * pesos[indice],
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? "0" : String(11 - resto);
}

function cnpjValido(cnpj: string): boolean {
  const digitos = cnpj.replace(/\D/g, "");
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) return false;
  const primeiro = calcularDigitoCnpj(digitos.slice(0, 12), pesosCnpjPrimeiro);
  const segundo = calcularDigitoCnpj(
    digitos.slice(0, 12) + primeiro,
    pesosCnpjSegundo,
  );
  return digitos.endsWith(primeiro + segundo);
}

function formatarCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 14);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
  if (digitos.length <= 8) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
  }
  if (digitos.length <= 12) {
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

const esquemaEmpresa = z
  .object({
    company_name: z.string().trim().min(2, "Informe o nome da empresa."),
    cnpj: z.string().refine(cnpjValido, "Informe um CNPJ válido."),
    email: z.string().trim().email("Informe um e-mail válido."),
    password: senhaSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((dados) => dados.password === dados.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type DadosCandidato = z.infer<typeof esquemaCandidato>;
type DadosEmpresa = z.infer<typeof esquemaEmpresa>;
type TipoCadastro = "candidato" | "empresa";

export function RegisterPage() {
  const [parametros, setParametros] = useSearchParams();
  const tipo: TipoCadastro =
    parametros.get("perfil") === "empresa" ? "empresa" : "candidato";

  const selecionarTipo = (novoTipo: TipoCadastro) => {
    setParametros({ perfil: novoTipo });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">
            Faça parte
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-brand-dark sm:text-4xl">
            Vamos dar o próximo passo?
          </h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-500">
            Escolha como você quer usar o TrampoCerto. Você poderá completar seu
            perfil depois.
          </p>
        </div>

        <div
          className="mt-8 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-2"
          role="tablist"
          aria-label="Tipo de cadastro"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tipo === "candidato"}
            onClick={() => selecionarTipo("candidato")}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
              tipo === "candidato"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-slate-500 hover:text-brand-dark"
            }`}
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Sou candidato
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipo === "empresa"}
            onClick={() => selecionarTipo("empresa")}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
              tipo === "empresa"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-slate-500 hover:text-brand-dark"
            }`}
          >
            <Building2 className="h-4 w-4" aria-hidden="true" />
            Sou empresa
          </button>
        </div>

        {tipo === "candidato" ? (
          <FormularioCandidato key="candidato" />
        ) : (
          <FormularioEmpresa key="empresa" />
        )}
      </div>
    </section>
  );
}

function FormularioCandidato() {
  const { cadastrarCandidato } = useAuth();
  const { mostrarToast } = useToast();
  const navegar = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DadosCandidato>({
    resolver: zodResolver(esquemaCandidato),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const mutacao = useMutation({
    mutationFn: ({ confirmPassword: _confirmar, ...dados }: DadosCandidato) =>
      cadastrarCandidato(dados),
    onSuccess: (usuario) => {
      queryClient.setQueryData(["sessao", "usuario"], usuario);
      mostrarToast("Seu cadastro de candidato está pronto.", "sucesso");
      navegar("/painel", { replace: true });
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível concluir o cadastro."),
        "erro",
      );
    },
  });

  return (
    <div className="mt-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-card sm:p-9">
      <h2 className="text-xl font-extrabold text-brand-dark">
        Perfil de candidato
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Use seus dados para acompanhar candidaturas e montar seu currículo.
      </p>

      <form
        className="mt-7 space-y-5"
        noValidate
        onSubmit={handleSubmit((dados) => mutacao.mutate(dados))}
      >
        <CampoTexto
          id="full_name"
          label="Nome completo"
          autoComplete="name"
          placeholder="Como podemos chamar você?"
          registro={register("full_name")}
          erro={errors.full_name?.message}
        />
        <CampoTexto
          id="candidate-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          registro={register("email")}
          erro={errors.email?.message}
        />
        <PasswordField
          id="candidate-password"
          label="Senha"
          autoComplete="new-password"
          registro={register("password")}
          erro={errors.password?.message}
        />
        <PasswordField
          id="candidate-confirm-password"
          label="Confirme sua senha"
          autoComplete="new-password"
          registro={register("confirmPassword")}
          erro={errors.confirmPassword?.message}
        />
        <p className="-mt-2 text-xs leading-5 text-slate-400">
          A senha precisa ter ao menos 10 caracteres, incluindo letras e
          números.
        </p>
        <Button larguraTotal type="submit" disabled={mutacao.isPending}>
          {mutacao.isPending ? "Criando conta..." : "Criar conta de candidato"}
          {!mutacao.isPending && (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem uma conta?{" "}
        <Link
          to="/entrar"
          className="font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

function FormularioEmpresa() {
  const { cadastrarEmpresa } = useAuth();
  const { mostrarToast } = useToast();
  const navegar = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DadosEmpresa>({
    resolver: zodResolver(esquemaEmpresa),
    defaultValues: {
      company_name: "",
      cnpj: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const mutacao = useMutation({
    mutationFn: ({ confirmPassword: _confirmar, ...dados }: DadosEmpresa) =>
      cadastrarEmpresa(dados),
    onSuccess: (usuario) => {
      queryClient.setQueryData(["sessao", "usuario"], usuario);
      mostrarToast("O acesso da sua empresa está pronto.", "sucesso");
      navegar("/painel", { replace: true });
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível concluir o cadastro."),
        "erro",
      );
    },
  });

  return (
    <div className="mt-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-card sm:p-9">
      <h2 className="text-xl font-extrabold text-brand-dark">
        Perfil de empresa
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Publique oportunidades com salário e mantenha os candidatos informados.
      </p>

      <form
        className="mt-7 space-y-5"
        noValidate
        onSubmit={handleSubmit((dados) => mutacao.mutate(dados))}
      >
        <CampoTexto
          id="company-name"
          label="Nome da empresa"
          autoComplete="organization"
          placeholder="Nome usado nas suas vagas"
          registro={register("company_name")}
          erro={errors.company_name?.message}
        />
        <div>
          <label htmlFor="cnpj" className="form-label">
            CNPJ
          </label>
          <input
            {...register("cnpj")}
            id="cnpj"
            inputMode="numeric"
            autoComplete="off"
            placeholder="00.000.000/0000-00"
            className={`form-input ${errors.cnpj ? "form-input-error" : ""}`}
            aria-invalid={Boolean(errors.cnpj)}
            aria-describedby={errors.cnpj ? "cnpj-erro" : undefined}
            onChange={(evento) => {
              setValue("cnpj", formatarCnpj(evento.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
          {errors.cnpj && (
            <p id="cnpj-erro" className="form-error" role="alert">
              {errors.cnpj.message}
            </p>
          )}
        </div>
        <CampoTexto
          id="company-email"
          label="E-mail de trabalho"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          registro={register("email")}
          erro={errors.email?.message}
        />
        <PasswordField
          id="company-password"
          label="Senha"
          autoComplete="new-password"
          registro={register("password")}
          erro={errors.password?.message}
        />
        <PasswordField
          id="company-confirm-password"
          label="Confirme sua senha"
          autoComplete="new-password"
          registro={register("confirmPassword")}
          erro={errors.confirmPassword?.message}
        />
        <p className="-mt-2 text-xs leading-5 text-slate-400">
          A senha precisa ter ao menos 10 caracteres, incluindo letras e
          números.
        </p>
        <Button larguraTotal type="submit" disabled={mutacao.isPending}>
          {mutacao.isPending ? "Criando conta..." : "Criar conta de empresa"}
          {!mutacao.isPending && (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem uma conta?{" "}
        <Link
          to="/entrar"
          className="font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

interface CampoTextoProps {
  id: string;
  label: string;
  registro: ReturnType<ReturnType<typeof useForm>["register"]>;
  erro?: string;
  type?: "text" | "email";
  autoComplete: string;
  placeholder: string;
}

function CampoTexto({
  id,
  label,
  registro,
  erro,
  type = "text",
  autoComplete,
  placeholder,
}: CampoTextoProps) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        {...registro}
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
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
