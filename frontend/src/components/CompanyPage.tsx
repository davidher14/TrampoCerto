import { LoaderCircle, SearchX } from "lucide-react";
import type { ReactNode } from "react";

export function CompanyPage({
  children,
  largura = "max-w-7xl",
}: {
  children: ReactNode;
  largura?: string;
}) {
  return (
    <section className="min-h-[65vh] bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className={`mx-auto ${largura}`}>{children}</div>
    </section>
  );
}

export function CompanyPageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function CompanyLoading({
  mensagem = "Carregando...",
}: {
  mensagem?: string;
}) {
  return (
    <div className="flex min-h-48 items-center justify-center" role="status">
      <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
        <LoaderCircle
          className="h-5 w-5 animate-spin text-brand"
          aria-hidden="true"
        />
        {mensagem}
      </span>
    </div>
  );
}

export function CompanyError({
  titulo = "Não foi possível carregar as informações.",
  onRetry,
}: {
  titulo?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-3xl border border-red-100 bg-white p-7 text-center shadow-card"
      role="alert"
    >
      <p className="font-bold text-red-800">{titulo}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Verifique sua conexão e tente novamente.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-10 rounded-xl px-4 text-sm font-bold text-brand hover:bg-brand-pale focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function CompanyEmpty({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 text-center shadow-card">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-pale text-brand">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-extrabold text-brand-dark">{titulo}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {descricao}
      </p>
      {children}
    </div>
  );
}
