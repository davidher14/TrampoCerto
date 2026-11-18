import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "./Brand";
import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { useToast } from "./ToastProvider";

export function AppShell() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { usuario, sair } = useAuth();
  const { mostrarToast } = useToast();
  const queryClient = useQueryClient();
  const navegar = useNavigate();
  const localizacao = useLocation();

  const voltarAoTopo = () => {
    setMenuAberto(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const encerrarSessao = async () => {
    try {
      await sair();
      mostrarToast("Você saiu da sua conta.", "sucesso");
    } catch {
      mostrarToast(
        "A sessão foi encerrada neste dispositivo. Não foi possível confirmar a revogação no servidor.",
        "info",
      );
    } finally {
      queryClient.clear();
      setMenuAberto(false);
      navegar("/", { replace: true });
    }
  };

  const linksPublicos = [
    { href: "/#como-funciona", texto: "Como funciona" },
    { href: "/#compromissos", texto: "Nossos compromissos" },
  ];

  const mostrarLinksDeInicio = localizacao.pathname === "/";
  const mostrarNavegacaoInferior =
    localizacao.pathname.startsWith("/candidato") ||
    localizacao.pathname.startsWith("/empresa");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand onDark />

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Navegação principal"
          >
            {usuario ? (
              <Link
                to="/painel"
                className="text-sm font-semibold text-white/80 transition hover:text-white"
              >
                Meu espaço
              </Link>
            ) : (
              mostrarLinksDeInicio &&
              linksPublicos.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-white/80 transition hover:text-white"
                >
                  {link.texto}
                </a>
              ))
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {usuario ? (
              <>
                <span className="max-w-48 truncate text-sm font-medium text-white/80">
                  {usuario.email}
                </span>
                <Button variante="secundaria" onClick={() => void encerrarSessao()}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/entrar"
                  className="rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  Entrar
                </Link>
                <ButtonLink
                  to="/cadastro"
                  variante="secundaria"
                  className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
                >
                  Começar agora
                </ButtonLink>
              </>
            )}
          </div>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:hidden"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            aria-controls="menu-celular"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {menuAberto && (
          <nav
            id="menu-celular"
            className="border-t border-white/10 bg-navy px-4 py-4 shadow-lg md:hidden"
            aria-label="Navegação para celular"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {usuario ? (
                <>
                  <Link
                    to="/painel"
                    onClick={voltarAoTopo}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Meu espaço
                  </Link>
                  <Button
                    variante="secundaria"
                    larguraTotal
                    onClick={() => void encerrarSessao()}
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sair da conta
                  </Button>
                </>
              ) : (
                <>
                  {mostrarLinksDeInicio &&
                    linksPublicos.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuAberto(false)}
                        className="rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                      >
                        {link.texto}
                      </a>
                    ))}
                  <Link
                    to="/entrar"
                    onClick={voltarAoTopo}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Entrar
                  </Link>
                  <ButtonLink
                    to="/cadastro"
                    variante="secundaria"
                    onClick={voltarAoTopo}
                    className="w-full !border-white/30 !bg-transparent !text-white hover:!bg-white/10"
                  >
                    Começar agora
                  </ButtonLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-navy text-white">
        <div
          className={`mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-8 ${
            mostrarNavegacaoInferior ? "pb-24 md:pb-7" : ""
          }`}
        >
          <Brand compact onDark />
          <p className="text-sm text-blue-100/80">
            Trabalho digno começa com transparência.
          </p>
          <p className="text-xs font-medium text-blue-100/60">
            © {new Date().getFullYear()} TrampoCerto
          </p>
        </div>
      </footer>
    </div>
  );
}
