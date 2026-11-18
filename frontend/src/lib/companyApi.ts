import axios from "axios";
import { api } from "./api";
import type { ApplicationFeedback, Job, PaginatedResponse } from "../types/candidate";
import type {
  CompanyApplication,
  CompanyCandidateProfile,
  CompanyDashboard,
  CompanyJobInput,
  CompanyProfile,
  CompanyProfileInput,
  PendingCandidate,
} from "../types/company";

export const companyQueryKeys = {
  dashboard: ["company", "dashboard"] as const,
  profile: ["company", "profile"] as const,
  jobs: ["company", "jobs"] as const,
  applications: (jobId: number) =>
    ["company", "applications", jobId] as const,
  candidateProfile: (applicationId: number) =>
    ["company", "candidate-profile", applicationId] as const,
};

export async function obterPainelEmpresa(): Promise<CompanyDashboard> {
  const { data } = await api.get<CompanyDashboard>("/companies/dashboard");
  return data;
}

export async function obterPerfilEmpresa(): Promise<CompanyProfile> {
  const { data } = await api.get<CompanyProfile>("/companies/me");
  return data;
}

export async function atualizarPerfilEmpresa(
  dados: CompanyProfileInput,
): Promise<CompanyProfile> {
  const { data } = await api.patch<CompanyProfile>("/companies/me", dados);
  return data;
}

export async function enviarLogoEmpresa(arquivo: File): Promise<void> {
  const formulario = new FormData();
  formulario.append("arquivo", arquivo);
  await api.post("/companies/me/logo", formulario, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function listarVagasEmpresa(): Promise<PaginatedResponse<Job>> {
  const { data } = await api.get<PaginatedResponse<Job>>(
    "/companies/jobs",
    { params: { page: 1, page_size: 100 } },
  );
  return data;
}

export async function criarVagaEmpresa(
  dados: CompanyJobInput,
): Promise<Job> {
  const { data } = await api.post<Job>("/companies/jobs", dados);
  return data;
}

export async function atualizarVagaEmpresa(
  jobId: number,
  dados: CompanyJobInput,
): Promise<Job> {
  const { data } = await api.patch<Job>(`/companies/jobs/${jobId}`, dados);
  return data;
}

export async function publicarVagaEmpresa(jobId: number): Promise<Job> {
  const { data } = await api.patch<Job>(`/companies/jobs/${jobId}`, {
    status: "open",
  });
  return data;
}

export async function excluirVagaEmpresa(jobId: number): Promise<void> {
  await api.delete(`/companies/jobs/${jobId}`);
}

export async function encerrarVagaEmpresa(
  jobId: number,
): Promise<{ job_id: number; status: string; message: string }> {
  const { data } = await api.post(`/companies/jobs/${jobId}/close`);
  return data;
}

export async function listarCandidatos(
  jobId: number,
): Promise<CompanyApplication[]> {
  const { data } = await api.get<CompanyApplication[]>(
    `/companies/jobs/${jobId}/applications`,
  );
  return data;
}

export async function registrarFeedback(
  applicationId: number,
  status: ApplicationFeedback["status"],
  message: string,
): Promise<ApplicationFeedback> {
  const { data } = await api.post<ApplicationFeedback>(
    `/companies/applications/${applicationId}/feedback`,
    { status, message },
  );
  return data;
}

export async function obterPerfilCandidatoEmpresa(
  applicationId: number,
): Promise<CompanyCandidateProfile> {
  const { data } = await api.get<CompanyCandidateProfile>(
    `/companies/applications/${applicationId}/candidate-profile`,
  );
  return data;
}

export async function baixarCurriculoCandidato(
  applicationId: number,
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/companies/applications/${applicationId}/resume`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(data);
  const ancora = document.createElement("a");
  ancora.href = url;
  ancora.download = `curriculo-candidato-${applicationId}.pdf`;
  ancora.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function obterPendenciasEncerramento(
  erro: unknown,
): PendingCandidate[] {
  if (!axios.isAxiosError(erro)) return [];
  const resposta: unknown = erro.response?.data;
  if (typeof resposta !== "object" || resposta === null || !("error" in resposta)) {
    return [];
  }
  const erroApi = resposta.error;
  if (typeof erroApi !== "object" || erroApi === null || !("pending_candidates" in erroApi)) {
    return [];
  }
  const candidatos = erroApi.pending_candidates;
  if (!Array.isArray(candidatos)) return [];
  return candidatos.filter(
    (candidato): candidato is PendingCandidate =>
      typeof candidato === "object" &&
      candidato !== null &&
      "application_id" in candidato &&
      typeof candidato.application_id === "number" &&
      "name" in candidato &&
      typeof candidato.name === "string" &&
      "email" in candidato &&
      typeof candidato.email === "string",
  );
}
