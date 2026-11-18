import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  perfisPermitidos?: UserRole[];
  somenteVisitante?: boolean;
}

export function ProtectedRoute({
  perfisPermitidos,
  somenteVisitante = false,
}: ProtectedRouteProps) {
  const { usuario, pronto } = useAuth();
  const localizacao = useLocation();

  if (!pronto) {
    return (
      <div className="grid min-h-[65vh] place-items-center" role="status">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <LoaderCircle
            className="h-5 w-5 animate-spin text-brand"
            aria-hidden="true"
          />
          Verificando sua sessão...
        </div>
      </div>
    );
  }

  if (somenteVisitante && usuario) {
    return <Navigate to="/painel" replace />;
  }

  if (somenteVisitante) {
    return <Outlet />;
  }

  if (!usuario) {
    return (
      <Navigate
        to="/entrar"
        replace
        state={{ origem: localizacao }}
      />
    );
  }

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.role)) {
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
}
