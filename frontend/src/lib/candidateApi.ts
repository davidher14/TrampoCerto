import { api } from "./api";
import type {
  Application,
  CandidateProfile,
  CandidateResumeInput,
  Job,
  JobSearchParams,
  PaginatedResponse,
} from "../types/candidate";

export const candidateQueryKeys = {
  profile: ["candidate", "profile"] as const,
  resume: ["candidate", "resume"] as const,
  applications: ["candidate", "applications"] as const,
  savedJobs: ["candidate", "saved-jobs"] as const,
  jobs: ["candidate", "jobs"] as const,
  job: (jobId: number) => ["candidate", "job", jobId] as const,
};

export async function buscarVagas(
  parametros: JobSearchParams,
): Promise<PaginatedResponse<Job>> {
  const { data } = await api.get<PaginatedResponse<Job>>("/jobs", {
    params: parametros,
  });
  return data;
}

export async function obterVaga(jobId: number): Promise<Job> {
  const { data } = await api.get<Job>(`/jobs/${jobId}`);
  return data;
}

export async function obterPerfilCandidato(): Promise<CandidateProfile> {
  const { data } = await api.get<CandidateProfile>("/profiles/me");
  return data;
}

export async function atualizarPerfilCandidato(
  alteracoes: Record<string, string | null>,
): Promise<CandidateProfile> {
  const { data } = await api.patch<CandidateProfile>(
    "/profiles/me",
    alteracoes,
  );
  return data;
}

export async function atualizarCurriculo(
  curriculo: CandidateResumeInput,
): Promise<CandidateProfile> {
  const { data } = await api.put<CandidateProfile>(
    "/profiles/me/curriculo",
    curriculo,
  );
  return data;
}

export async function enviarCurriculoPdf(arquivo: File): Promise<void> {
  const formulario = new FormData();
  formulario.append("arquivo", arquivo);
  await api.post("/profiles/me/curriculo/pdf", formulario, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function obterCandidaturas(): Promise<Application[]> {
  const { data } = await api.get<Application[]>("/applications/me");
  return data;
}

export async function obterVagasSalvas(): Promise<Job[]> {
  const { data } = await api.get<Job[]>("/jobs/saved/me");
  return data;
}

export async function salvarVaga(jobId: number): Promise<void> {
  await api.post(`/jobs/${jobId}/saved`);
}

export async function removerVagaSalva(jobId: number): Promise<void> {
  await api.delete(`/jobs/${jobId}/saved`);
}

export async function candidatar(
  jobId: number,
  coverLetter: string | null,
): Promise<Application> {
  const { data } = await api.post<Application>(`/jobs/${jobId}/applications`, {
    cover_letter: coverLetter,
  });
  return data;
}
