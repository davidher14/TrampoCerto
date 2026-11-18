import axios, {
  AxiosHeaders,
} from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiErrorResponse, AuthSession, AuthUser } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";
const ACCESS_TOKEN_KEY = "trampocerto.access";
const REFRESH_TOKEN_KEY = "trampocerto.refresh";
const USER_KEY = "trampocerto.user";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  __trampocertoRetry?: boolean;
}

function sessionStorageDisponivel(): boolean {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function obterTokenAcesso(): string | null {
  return sessionStorageDisponivel()
    ? window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
    : null;
}

export function obterRefreshToken(): string | null {
  return sessionStorageDisponivel()
    ? window.sessionStorage.getItem(REFRESH_TOKEN_KEY)
    : null;
}

export function obterUsuarioSalvo(): AuthUser | null {
  if (!sessionStorageDisponivel()) return null;

  const salvo = window.sessionStorage.getItem(USER_KEY);
  if (!salvo) return null;

  try {
    const usuario: unknown = JSON.parse(salvo);
    if (
      typeof usuario === "object" &&
      usuario !== null &&
      "id" in usuario &&
      "email" in usuario &&
      "role" in usuario &&
      typeof usuario.id === "number" &&
      typeof usuario.email === "string" &&
      (usuario.role === "candidate" || usuario.role === "company")
    ) {
      return usuario as AuthUser;
    }
  } catch {
    limparSessao();
    return null;
  }

  limparSessao();
  return null;
}

export function salvarSessao(sessao: AuthSession): void {
  if (!sessionStorageDisponivel()) return;

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, sessao.access_token);
  window.sessionStorage.setItem(REFRESH_TOKEN_KEY, sessao.refresh_token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(sessao.user));
}

export function limparSessao(): void {
  if (!sessionStorageDisponivel()) return;

  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

let renovacaoEmAndamento: Promise<AuthSession> | null = null;

export function renovarSessao(): Promise<AuthSession> {
  if (!renovacaoEmAndamento) {
    const refreshToken = obterRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error("Sessão expirada."));
    }

    renovacaoEmAndamento = api
      .post<AuthSession>("/auth/refresh", { refresh_token: refreshToken })
      .then(({ data }) => {
        salvarSessao(data);
        return data;
      })
      .finally(() => {
        renovacaoEmAndamento = null;
      });
  }

  return renovacaoEmAndamento;
}

api.interceptors.request.use((config) => {
  const token = obterTokenAcesso();
  if (token) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (erro: AxiosError<ApiErrorResponse>) => {
    const config = erro.config as RetriableRequestConfig | undefined;
    const url = config?.url ?? "";
    const rotaDeAutenticacao = ["/auth/login", "/auth/refresh"].some((rota) =>
      url.includes(rota),
    );

    if (
      erro.response?.status !== 401 ||
      !config ||
      config.__trampocertoRetry ||
      rotaDeAutenticacao
    ) {
      return Promise.reject(erro);
    }

    config.__trampocertoRetry = true;
    try {
      const sessao = await renovarSessao();
      config.headers = AxiosHeaders.from(config.headers);
      config.headers.set("Authorization", `Bearer ${sessao.access_token}`);
      return await api.request(config);
    } catch (falhaAoRenovar) {
      limparSessao();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("trampocerto:sessao-expirada"));
      }
      return Promise.reject(falhaAoRenovar);
    }
  },
);

export function obterMensagemErro(
  erro: unknown,
  mensagemPadrao: string,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(erro)) {
    return erro.response?.data?.error?.message ?? mensagemPadrao;
  }
  return mensagemPadrao;
}
