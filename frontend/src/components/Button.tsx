import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primaria" | "secundaria" | "fantasma";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variante?: Variante;
  larguraTotal?: boolean;
}

const estilos: Record<Variante, string> = {
  primaria:
    "bg-primary text-white shadow-sm hover:bg-primary-hover disabled:bg-primary/60",
  secundaria:
    "border border-border bg-card text-navy hover:border-primary/40 hover:bg-soft",
  fantasma: "bg-transparent text-muted hover:bg-soft hover:text-navy",
};

export function Button({
  children,
  variante = "primaria",
  larguraTotal = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-70 ${estilos[variante]} ${larguraTotal ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
