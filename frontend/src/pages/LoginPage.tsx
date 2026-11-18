import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { PasswordField } from "../components/PasswordField";
import { useToast } from "../components/ToastProvider";
import { obterMensagemErro } from "../lib/api";
import type { LoginFormData } from "../types/auth";

const esquemaLogin = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

type DadosLogin = z.infer<typeof esquemaLogin>;

interface EstadoDeNavegacao {
  origem?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
}

export function LoginPage() {
  const { entrar } = useAuth();
  const { mostrarToast } = useToast();
  const navegar = useNavigate();
  const localizacao = useLocation();
  const queryClient = useQueryClient();
  const estado = localizacao.state as EstadoDeNavegacao | null;
  const origem = estado?.origem;
  const caminhoOrigem = origem?.pathname;
  const destino =
    caminhoOrigem?.startsWith("/") &&
    !caminhoOrigem.startsWith("//") &&
    !caminhoOrigem.includes("\\")
    ? `${caminhoOrigem}${origem?.search ?? ""}${origem?.hash ?? ""}`
    : "/painel";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DadosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const mutacao = useMutation({
    mutationFn: (dados: LoginFormData) => entrar(dados),
    onSuccess: (usuario) => {
      queryClient.setQueryData(["sessao", "usuario"], usuario);
      mostrarToast("Que bom ter você de volta!", "sucesso");
      navegar(destino, { replace: true });
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível entrar. Tente novamente."),
        "erro",
      );
    },
  });

  const enviar = handleSubmit((dados) => mutacao.mutate(dados));

  return (
    <section className="mx-auto grid min-h-[calc(100vh-9.5rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
      <aside className="hidden rounded-[2rem] bg-brand-dark p-10 text-white lg:block">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-blue-200">
          <ShieldCheck className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">
          Transparência também é cuidado
        </p>
        <h1 className="mt-4 max-w-md text-4xl font-black leading-tight">
          Um processo seletivo que respeita o seu tempo.
        </h1>
        <p className="mt-5 max-w-md leading-7 text-blue-100/80">
          Acompanhe suas etapas e receba retorno sobre cada candidatura, sem
          ficar no escuro.
        </p>
        <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-blue-100">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Seu próximo passo começa aqui
        </div>
      </aside>

      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-card sm:p-9">
          <div className="mb-8">
            <p className="text-sm font-extrabold uppercase tracking-wide text-brand">
              Acesse sua conta
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-brand-dark">
              Boas-vindas de volta.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Entre para continuar sua jornada no TrampoCerto.
            </p>
          </div>

          <form onSubmit={enviar} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">
                E-mail
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                className={`form-input ${errors.email ? "form-input-error" : ""}`}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-erro" : undefined}
              />
              {errors.email && (
                <p id="email-erro" className="form-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <PasswordField
              id="password"
              label="Senha"
              autoComplete="current-password"
              registro={register("password")}
              erro={errors.password?.message}
            />

            <Button larguraTotal type="submit" disabled={mutacao.isPending}>
              {mutacao.isPending ? "Entrando..." : "Entrar"}
              {!mutacao.isPending && (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Ainda não tem conta?{" "}
            <Link
              to="/cadastro"
              className="font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              Criar cadastro
            </Link>
          </p>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Ao entrar, você concorda em usar o TrampoCerto de forma respeitosa e
          transparente.
        </p>
      </div>
    </section>
  );
}
