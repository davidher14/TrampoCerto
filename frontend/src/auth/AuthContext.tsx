import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, limparSessao, obterRefreshToken, obterUsuarioSalvo, renovarSessao, salvarSessao } from "../lib/api";
import type {
  AuthSession,
  AuthUser,
  CandidateRegistrationData,
  CompanyRegistrationData,
  LoginFormData,
} from "../types/auth";

interface AuthContextValue {
  usuario: AuthUser | null;
  pronto: boolean;
  entrar: (dados: LoginFormData) => Promise<AuthUser>;
  cadastrarCandidato: (dados: CandidateRegistrationData) => Promise<AuthUser>;
  cadastrarEmpresa: (dados: CompanyRegistrationData) => Promise<AuthUser>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<AuthUser | null>(obterUsuarioSalvo);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;

    const limparEstado = () => {
      limparSessao();
      setUsuario(null);
      setPronto(true);
    };

    const tratarSessaoExpirada = () => limparEstado();
    window.addEventListener("trampocerto:sessao-expirada", tratarSessaoExpirada);

    if (!obterRefreshToken()) {
      limparEstado();
    } else {
      void renovarSessao()
        .then((sessao) => {
          if (ativo) setUsuario(sessao.user);
        })
        .catch(limparEstado)
        .finally(() => {
          if (ativo) setPronto(true);
        });
    }

    return () => {
      ativo = false;
      window.removeEventListener(
        "trampocerto:sessao-expirada",
        tratarSessaoExpirada,
      );
    };
  }, []);

  const concluirAutenticacao = useCallback((sessao: AuthSession) => {
    salvarSessao(sessao);
    setUsuario(sessao.user);
    setPronto(true);
    return sessao.user;
  }, []);

  const entrar = useCallback(
    async (dados: LoginFormData) => {
      const { data } = await api.post<AuthSession>("/auth/login", dados);
      return concluirAutenticacao(data);
    },
    [concluirAutenticacao],
  );

  const cadastrarCandidato = useCallback(
    async (dados: CandidateRegistrationData) => {
      const { data } = await api.post<AuthSession>(
        "/auth/cadastro/candidato",
        dados,
      );
      return concluirAutenticacao(data);
    },
    [concluirAutenticacao],
  );

  const cadastrarEmpresa = useCallback(
    async (dados: CompanyRegistrationData) => {
      const { data } = await api.post<AuthSession>(
        "/auth/cadastro/empresa",
        dados,
      );
      return concluirAutenticacao(data);
    },
    [concluirAutenticacao],
  );

  const sair = useCallback(async () => {
    const refreshToken = obterRefreshToken();
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } finally {
      limparSessao();
      setUsuario(null);
    }
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      pronto,
      entrar,
      cadastrarCandidato,
      cadastrarEmpresa,
      sair,
    }),
    [usuario, pronto, entrar, cadastrarCandidato, cadastrarEmpresa, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }
  return contexto;
}
