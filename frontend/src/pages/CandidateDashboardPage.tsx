import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CircleUserRound,
  FileUser,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ButtonLink } from "../components/ButtonLink";
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
  obterCandidaturas,
  obterPerfilCandidato,
  obterVagasSalvas,
} from "../lib/candidateApi";

export function CandidateDashboardPage() {
  const { usuario } = useAuth();
  const perfil = useQuery({
    queryKey: candidateQueryKeys.profile,
    queryFn: obterPerfilCandidato,
  });
  const candidaturas = useQuery({
    queryKey: candidateQueryKeys.applications,
    queryFn: obterCandidaturas,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const vagasSalvas = useQuery({
    queryKey: candidateQueryKeys.savedJobs,
    queryFn: obterVagasSalvas,
  });
  const vagasRecentes = useQuery({
    queryKey: [...candidateQueryKeys.jobs, "recentes"],
    queryFn: () =>
      buscarVagas({ page: 1, page_size: 3, order_by: "recent" }),
  });

  if (perfil.isPending) return <LoadingState mensagem="Abrindo seu espaço..." />;
  if (perfil.isError) {
    return (
      <CandidatePage>
        <ErrorState
          titulo="Não foi possível carregar seu perfil."
          onRetry={() => void perfil.refetch()}
        />
      </CandidatePage>
    );
  }

  const nome = perfil.data.full_name.trim().split(/\s+/)[0] || "Candidato";

  return (
    <CandidatePage>
      <CandidatePageHeader
        eyebrow="Espaço do candidato"
        title={`Olá, ${nome}!`}
        description="Acompanhe sua jornada, mantenha seu currículo em dia e encontre a próxima oportunidade."
      >
        <ButtonLink to="/candidato/vagas" className="w-full sm:w-auto">
          <Search className="h-4 w-4" aria-hidden="true" />
          Buscar vagas
        </ButtonLink>
      </CandidatePageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResumoCard
          icone={FileUser}
          rotulo="Perfil preenchido"
          valor={`${perfil.data.completion_percentage}%`}
          detalhe={perfil.data.has_resume ? "Currículo PDF anexado" : "Adicione seu currículo em PDF"}
          href="/candidato/perfil"
        />
        <ResumoCard
          icone={BriefcaseBusiness}
          rotulo="Candidaturas"
          valor={candidaturas.isError ? "—" : String(candidaturas.data?.length ?? 0)}
          detalhe="Veja as etapas e os retornos"
          href="/candidato/candidaturas"
        />
        <ResumoCard
          icone={Bookmark}
          rotulo="Vagas salvas"
          valor={vagasSalvas.isError ? "—" : String(vagasSalvas.data?.length ?? 0)}
          detalhe="Oportunidades para conferir depois"
          href="/candidato/salvas"
        />
      </div>

      {perfil.data.completion_percentage < 100 && (
        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-brand/10 bg-brand-pale p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand">
              <CircleUserRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-extrabold text-brand-dark">
                Deixe seu perfil pronto para novas oportunidades
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Um currículo completo ajuda recrutadores a conhecerem melhor
                sua experiência.
              </p>
            </div>
          </div>
          <ButtonLink
            to="/candidato/perfil"
            variante="secundaria"
            className="w-full shrink-0 sm:w-auto"
          >
            Completar currículo
          </ButtonLink>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-brand">
              Feitas para você
            </p>
            <h2 className="mt-1 text-2xl font-black text-brand-dark">
              Vagas recentes
            </h2>
          </div>
          <Link
            to="/candidato/vagas"
            className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {vagasRecentes.isPending ? (
          <LoadingState mensagem="Buscando oportunidades..." />
        ) : vagasRecentes.isError ? (
          <ErrorState
            titulo="Não foi possível carregar as vagas recentes."
            onRetry={() => void vagasRecentes.refetch()}
          />
        ) : vagasRecentes.data.items.length === 0 ? (
          <EmptyState
            titulo="Ainda não há vagas abertas"
            descricao="Volte em breve para conferir novas oportunidades com salário informado."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {vagasRecentes.data.items.map((vaga) => (
              <JobCard
                key={vaga.id}
                vaga={vaga}
                salva={Boolean(vagasSalvas.data?.some((item) => item.id === vaga.id))}
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 rounded-3xl bg-brand-dark p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-blue-200">
            TrampoCerto
          </p>
          <h2 className="mt-2 text-xl font-extrabold">
            Salário informado. Etapas claras. Retorno respeitoso.
          </h2>
          <p className="mt-2 text-sm leading-6 text-blue-100/80">
            Seu acesso está vinculado a {usuario?.email}.
          </p>
        </div>
        <ButtonLink
          to="/candidato/candidaturas"
          variante="secundaria"
          className="mt-5 w-full shrink-0 bg-white text-brand-dark shadow-none hover:bg-blue-50 sm:mt-0 sm:w-auto"
        >
          Minhas candidaturas
        </ButtonLink>
      </div>
    </CandidatePage>
  );
}

function ResumoCard({
  icone: Icone,
  rotulo,
  valor,
  detalhe,
  href,
}: {
  icone: typeof FileUser;
  rotulo: string;
  valor: string;
  detalhe: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{rotulo}</p>
          <p className="mt-2 text-3xl font-black text-brand-dark">{valor}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-pale text-brand">
          <Icone className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{detalhe}</p>
    </Link>
  );
}
