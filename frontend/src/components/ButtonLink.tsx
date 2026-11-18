import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Variante = "primaria" | "secundaria" | "fantasma";

interface ButtonLinkProps extends LinkProps {
  children: ReactNode;
  variante?: Variante;
}

const estilos: Record<Variante, string> = {
  primaria:
    "bg-primary text-white shadow-sm hover:bg-primary-hover",
  secundaria:
    "border border-border bg-card text-navy hover:border-primary/40 hover:bg-soft",
  fantasma: "bg-transparent text-muted hover:bg-soft hover:text-navy",
};

export function ButtonLink({
  children,
  variante = "primaria",
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${estilos[variante]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
