import { BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand({
  compact = false,
  onDark = false,
}: {
  compact?: boolean;
  onDark?: boolean;
}) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      aria-label="TrampoCerto, página inicial"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-sm transition group-hover:-rotate-3">
        <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className={`text-lg font-bold tracking-tight ${onDark ? "text-white" : "text-navy"}`}>
          Trampo<span className={onDark ? "text-blue-200" : "text-primary"}>Certo</span>
        </span>
        {!compact && (
          <span className={`text-xs font-medium ${onDark ? "text-blue-100/80" : "text-muted"}`}>
            A vaga certa para você
          </span>
        )}
      </span>
    </Link>
  );
}
