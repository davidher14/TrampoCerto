import { Bookmark, BriefcaseBusiness, FileUser, Search, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/candidato/inicio", label: "Início", Icon: BriefcaseBusiness },
  { to: "/candidato/vagas", label: "Buscar vagas", Icon: Search },
  { to: "/candidato/candidaturas", label: "Candidaturas", Icon: FileUser },
  { to: "/candidato/salvas", label: "Vagas salvas", Icon: Bookmark },
  { to: "/candidato/perfil", label: "Meu currículo", Icon: UserRound },
];

export function CandidateLayout() {
  return (
    <>
      <div className="hidden border-b border-border bg-card md:block">
        <nav
          aria-label="Navegação do candidato"
          className="mx-auto hidden max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 md:flex lg:px-8"
        >
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to.endsWith("/inicio")}
              className={({ isActive }) =>
                `inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                  isActive
                    ? "bg-soft text-navy"
                    : "text-muted hover:bg-background hover:text-navy"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="pb-20 md:pb-0">
        <Outlet />
      </div>
      <nav
        aria-label="Navegação do candidato"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(27_37_89/6%)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 pt-2">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to.endsWith("/inicio")}
              className={({ isActive }) =>
                `flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center text-[10px] font-semibold leading-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  isActive ? "text-primary" : "text-muted"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
