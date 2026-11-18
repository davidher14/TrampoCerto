import type {
  ApplicationStatus,
  ContractType,
  WorkMode,
} from "../types/candidate";

const nomesModalidade: Record<WorkMode, string> = {
  onsite: "Presencial",
  hybrid: "Híbrido",
  remote: "Remoto",
};

const nomesContrato: Record<ContractType, string> = {
  clt: "CLT",
  pj: "Pessoa jurídica",
  internship: "Estágio",
  temporary: "Temporário",
  freelance: "Freelance",
  apprentice: "Aprendiz",
};

const nomesStatus: Record<ApplicationStatus, string> = {
  sent: "Enviada",
  analysis: "Em análise",
  interview: "Entrevista",
  approved: "Aprovada",
  rejected: "Não aprovada",
};

export function formatarSalario(
  minimo: number | string,
  maximo: number | string | null,
  moeda = "BRL",
): string {
  const formatarValor = (valor: number | string) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: moeda,
      maximumFractionDigits: 2,
    }).format(Number(valor));

  if (maximo === null) return `A partir de ${formatarValor(minimo)}`;
  if (Number(minimo) === Number(maximo)) return formatarValor(minimo);
  return `${formatarValor(minimo)} a ${formatarValor(maximo)}`;
}

export function nomeModalidade(modalidade: WorkMode): string {
  return nomesModalidade[modalidade];
}

export function nomeContrato(contrato: ContractType): string {
  return nomesContrato[contrato];
}

export function nomeStatus(status: ApplicationStatus): string {
  return nomesStatus[status];
}

export function formatarData(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(data));
}
