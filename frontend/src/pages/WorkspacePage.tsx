import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleUserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ButtonLink } from "../components/ButtonLink";

export function WorkspacePage() {
  const { usuario } = useAuth();
  const isCandidate = usuario?.role === "candidate";

  return (
    <section className="bg-slate-50 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] bg-brand-dark text-white shadow-card">
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-100">
                {isCandidate ? (
                  <CircleUserRound className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                )}
                {isCandidate ? "Espaço do candidato" : "Espaço da empresa"}
              </span>
              <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                {isCandidate
                  ? "Seu próximo passo profissional começa aqui."
                  : "Construa processos seletivos mais transparentes."}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-blue-100/80">
                A sessão está protegida e vinculada a{" "}
                <span className="font-bold text-white">{usuario?.email}</span>.
                {isCandidate
                  ? " Na próxima etapa, você poderá completar seu perfil e acompanhar suas candidaturas."
                  : " Na próxima etapa, você poderá completar o perfil da empresa e organizar suas vagas."}
              </p>
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10 text-blue-100">
              {isCandidate ? (
                <BriefcaseBusiness className="h-10 w-10" aria-hidden="true" />
              ) : (
                <Building2 className="h-10 w-10" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-pale text-brand">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-extrabold text-brand-dark">
              Uma jornada mais clara
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              Salário informado, etapas visíveis e retornos registrados são
              compromissos que fazem parte da plataforma.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-pale text-brand">
              {isCandidate ? (
                <CircleUserRound className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Building2 className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
            <h2 className="mt-5 text-xl font-extrabold text-brand-dark">
              Seu perfil está conectado
            </h2>
            <p className="mt-3 break-all leading-7 text-slate-600">
              {usuario?.email}
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              Voltar à página inicial
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        </div>

        <div className="mt-8 rounded-3xl border border-brand/10 bg-brand-pale p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <p className="text-sm font-extrabold text-brand-dark">
              Esta é a base da sua área
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              As telas específicas de {isCandidate ? "candidato" : "empresa"}{" "}
              serão adicionadas na próxima etapa do projeto.
            </p>
          </div>
          <ButtonLink
            to="/"
            variante="secundaria"
            className="mt-5 w-full shrink-0 sm:mt-0 sm:w-auto"
          >
            Conhecer os compromissos
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
