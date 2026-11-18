import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Banknote,
  ClipboardCheck,
  HeartHandshake,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ButtonLink } from "../components/ButtonLink";

const compromissos = [
  {
    icone: Banknote,
    titulo: "Salário à vista",
    texto: "Toda vaga informa a remuneração. Sem “a combinar” escondido.",
  },
  {
    icone: MessageCircleMore,
    titulo: "Retorno de verdade",
    texto: "Cada candidatura recebe uma atualização clara do processo.",
  },
  {
    icone: HeartHandshake,
    titulo: "Respeito até o fim",
    texto: "Uma vaga só é encerrada depois de dar retorno a todo mundo.",
  },
];

export function LandingPage() {
  return (
    <>
      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-dark shadow-sm">
              <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
              Trabalho com mais respeito
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-navy sm:text-5xl lg:text-6xl">
              A vaga certa começa com{" "}
              <span className="text-brand">uma relação transparente.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Um jeito mais simples e humano de encontrar oportunidades — com
              salário informado, etapas claras e retorno para cada pessoa.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                to="/cadastro?perfil=candidato"
                className="w-full sm:w-auto"
              >
                Quero encontrar uma vaga
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink
                to="/cadastro?perfil=empresa"
                variante="secundaria"
                className="w-full sm:w-auto"
              >
                Sou empresa
              </ButtonLink>
            </div>
            <a
              href="#compromissos"
              className="mt-8 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand"
            >
              Conheça nossos compromissos
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-brand">O nosso combinado</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-brand-dark">
                    Processo seletivo sem caixa-preta.
                  </h2>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-pale text-brand">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-8 space-y-4">
                {[
                  "Você sabe a faixa salarial antes de se candidatar",
                  "A empresa mantém você por dentro de cada etapa",
                  "Toda candidatura recebe um retorno final",
                ].map((item, indice) => (
                  <div
                    key={item}
                    className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                      <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="pt-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Compromisso 0{indice + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-brand-dark">
                        {item}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <div className="flex -space-x-2" aria-hidden="true">
                  {["bg-violet-300", "bg-amber-300", "bg-emerald-300"].map(
                    (cor) => (
                      <span
                        key={cor}
                        className={`h-8 w-8 rounded-full border-2 border-white ${cor}`}
                      />
                    ),
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  Mais clareza para os dois lados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="compromissos"
        className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">
              Não é benefício. É o mínimo.
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-brand-dark sm:text-4xl">
              Transparência em cada etapa.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              A gente acredita que respeito não pode depender da sorte. Por
              isso, esses compromissos fazem parte de todo processo no
              TrampoCerto.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {compromissos.map(({ icone: Icone, titulo, texto }, indice) => (
              <article
                key={titulo}
                className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card transition hover:-translate-y-1"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-pale text-brand">
                  <Icone className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-6 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Compromisso 0{indice + 1}
                </p>
                <h3 className="mt-2 text-xl font-extrabold text-brand-dark">
                  {titulo}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-24 bg-brand-dark px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">
              Um próximo passo mais leve
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Menos dúvida. Mais caminho pela frente.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-blue-100/80">
              Crie seu perfil e acompanhe uma jornada feita para ser simples,
              organizada e respeitosa.
            </p>
            <ButtonLink
              to="/cadastro?perfil=candidato"
              className="mt-8 bg-white text-brand-dark shadow-none hover:bg-blue-50"
            >
              Criar meu perfil
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icone: Search,
                titulo: "Encontre",
                texto: "Veja oportunidades com informações completas.",
              },
              {
                icone: ClipboardCheck,
                titulo: "Acompanhe",
                texto: "Saiba o que acontece depois de se candidatar.",
              },
            ].map(({ icone: Icone, titulo, texto }) => (
              <article
                key={titulo}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"
              >
                <Icone className="h-7 w-7 text-blue-200" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-extrabold">{titulo}</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100/75">
                  {texto}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
