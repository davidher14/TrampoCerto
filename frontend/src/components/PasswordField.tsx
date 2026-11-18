import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: string;
  registro: UseFormRegisterReturn;
  erro?: string;
}

export function PasswordField({
  id,
  label,
  autoComplete,
  registro,
  erro,
}: PasswordFieldProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="relative">
        <input
          {...registro}
          id={id}
          type={visivel ? "text" : "password"}
          autoComplete={autoComplete}
          className={`form-input pr-12 ${erro ? "form-input-error" : ""}`}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-400 transition hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
        >
          {visivel ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {erro && (
        <p id={`${id}-erro`} className="form-error" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
