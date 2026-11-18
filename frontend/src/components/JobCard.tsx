import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";
import {
  formatarSalario,
  nomeContrato,
  nomeModalidade,
} from "../lib/candidateFormat";
import type { Job } from "../types/candidate";

export function JobCard({
  vaga,
  salva,
}: {
  vaga: Job;
  salva: boolean;
}) {
  const aberta = vaga.status === "open";

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-brand">
            {vaga.company.name}
          </p>
          <h2 className="mt-1 text-lg font-extrabold leading-snug text-brand-dark">
            {aberta ? (
              <Link
                to={`/candidato/vagas/${vaga.id}`}
                className="rounded-sm hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                {vaga.title}
              </Link>
            ) : (
              vaga.title
            )}
          </h2>
        </div>
        <FavoriteButton jobId={vaga.id} salva={salva} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-brand-pale px-3 py-1 text-xs font-bold text-brand-dark">
          {vaga.area}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {nomeModalidade(vaga.work_mode)}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {nomeContrato(vaga.contract_type)}
        </span>
        {!aberta && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            Vaga encerrada
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {vaga.city}, {vaga.state}
          </p>
          <p className="mt-1 text-sm font-bold text-success">
            {formatarSalario(
              vaga.salary_min,
              vaga.salary_max,
              vaga.salary_currency,
            )}
          </p>
        </div>
        {aberta && (
          <Link
            to={`/candidato/vagas/${vaga.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-brand-dark transition hover:border-brand/40 hover:bg-brand-pale focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            Ver detalhes
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
