import { useQuery } from "@tanstack/react-query";
import {
  CandidatePage,
  CandidatePageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/CandidatePage";
import { JobCard } from "../components/JobCard";
import { ButtonLink } from "../components/ButtonLink";
import {
  candidateQueryKeys,
  obterVagasSalvas,
} from "../lib/candidateApi";

export function CandidateSavedJobsPage() {
  const vagas = useQuery({
    queryKey: candidateQueryKeys.savedJobs,
    queryFn: obterVagasSalvas,
  });

  return (
    <CandidatePage>
      <CandidatePageHeader
        eyebrow="Suas oportunidades"
        title="Vagas salvas"
        description="Guarde oportunidades para comparar e consultar quando quiser."
      />
      {vagas.isPending ? (
        <LoadingState mensagem="Carregando vagas salvas..." />
      ) : vagas.isError ? (
        <ErrorState
          titulo="Não foi possível carregar suas vagas salvas."
          onRetry={() => void vagas.refetch()}
        />
      ) : vagas.data.length === 0 ? (
        <EmptyState
          titulo="Você ainda não salvou vagas"
          descricao="Ao encontrar uma oportunidade interessante, toque no coração para guardá-la aqui."
        >
          <ButtonLink to="/candidato/vagas" className="mt-5">
            Buscar vagas
          </ButtonLink>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {vagas.data.map((vaga) => (
            <JobCard key={vaga.id} vaga={vaga} salva />
          ))}
        </div>
      )}
    </CandidatePage>
  );
}
