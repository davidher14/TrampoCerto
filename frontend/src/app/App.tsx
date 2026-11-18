import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { CandidateLayout } from "../components/CandidateLayout";
import { CompanyLayout } from "../components/CompanyLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ToastProvider } from "../components/ToastProvider";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ButtonLink } from "../components/ButtonLink";
import { LoadingState } from "../components/CandidatePage";

const CandidateApplicationsPage = lazy(() =>
  import("../pages/CandidateApplicationsPage").then((pagina) => ({
    default: pagina.CandidateApplicationsPage,
  })),
);
const CandidateDashboardPage = lazy(() =>
  import("../pages/CandidateDashboardPage").then((pagina) => ({
    default: pagina.CandidateDashboardPage,
  })),
);
const CandidateJobDetailPage = lazy(() =>
  import("../pages/CandidateJobDetailPage").then((pagina) => ({
    default: pagina.CandidateJobDetailPage,
  })),
);
const CandidateJobsPage = lazy(() =>
  import("../pages/CandidateJobsPage").then((pagina) => ({
    default: pagina.CandidateJobsPage,
  })),
);
const CandidateProfilePage = lazy(() =>
  import("../pages/CandidateProfilePage").then((pagina) => ({
    default: pagina.CandidateProfilePage,
  })),
);
const CandidateSavedJobsPage = lazy(() =>
  import("../pages/CandidateSavedJobsPage").then((pagina) => ({
    default: pagina.CandidateSavedJobsPage,
  })),
);
const CompanyApplicationsPage = lazy(() =>
  import("../pages/CompanyApplicationsPage").then((pagina) => ({
    default: pagina.CompanyApplicationsPage,
  })),
);
const CompanyDashboardPage = lazy(() =>
  import("../pages/CompanyDashboardPage").then((pagina) => ({
    default: pagina.CompanyDashboardPage,
  })),
);
const CompanyJobFormPage = lazy(() =>
  import("../pages/CompanyJobFormPage").then((pagina) => ({
    default: pagina.CompanyJobFormPage,
  })),
);
const CompanyJobsPage = lazy(() =>
  import("../pages/CompanyJobsPage").then((pagina) => ({
    default: pagina.CompanyJobsPage,
  })),
);
const CompanyProfilePage = lazy(() =>
  import("../pages/CompanyProfilePage").then((pagina) => ({
    default: pagina.CompanyProfilePage,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

function RotaPainel() {
  const { usuario } = useAuth();
  return (
    <Navigate
      to={usuario?.role === "company" ? "/empresa/inicio" : "/candidato/inicio"}
      replace
    />
  );
}

function PaginaNaoEncontrada() {
  return (
    <section className="grid min-h-[65vh] place-items-center px-4 py-16 text-center">
      <div className="max-w-lg">
        <p className="text-sm font-extrabold uppercase tracking-wide text-brand">
          Erro 404
        </p>
        <h1 className="mt-3 text-3xl font-black text-brand-dark">
          Não encontramos esta página.
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          O endereço pode estar incorreto ou a página pode ter mudado.
        </p>
        <ButtonLink to="/" className="mt-7">
          Voltar ao início
        </ButtonLink>
      </div>
    </section>
  );
}

function RotasDaAplicacao() {
  return (
    <Suspense fallback={<LoadingState mensagem="Abrindo sua área..." />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<LandingPage />} />
          <Route element={<ProtectedRoute somenteVisitante />}>
            <Route path="/entrar" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/painel" element={<RotaPainel />} />
            <Route element={<ProtectedRoute perfisPermitidos={["candidate"]} />}>
              <Route path="/candidato" element={<CandidateLayout />}>
                <Route index element={<Navigate to="inicio" replace />} />
                <Route path="inicio" element={<CandidateDashboardPage />} />
                <Route path="vagas" element={<CandidateJobsPage />} />
                <Route path="vagas/:jobId" element={<CandidateJobDetailPage />} />
                <Route
                  path="candidaturas"
                  element={<CandidateApplicationsPage />}
                />
                <Route path="salvas" element={<CandidateSavedJobsPage />} />
                <Route path="perfil" element={<CandidateProfilePage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute perfisPermitidos={["company"]} />}>
              <Route path="/empresa" element={<CompanyLayout />}>
                <Route index element={<Navigate to="inicio" replace />} />
                <Route path="inicio" element={<CompanyDashboardPage />} />
                <Route path="vagas" element={<CompanyJobsPage />} />
                <Route
                  path="vagas/nova"
                  element={<CompanyJobFormPage />}
                />
                <Route
                  path="vagas/:jobId/editar"
                  element={<CompanyJobFormPage />}
                />
                <Route
                  path="vagas/:jobId/candidatos"
                  element={<CompanyApplicationsPage />}
                />
                <Route path="perfil" element={<CompanyProfilePage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<PaginaNaoEncontrada />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <RotasDaAplicacao />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
