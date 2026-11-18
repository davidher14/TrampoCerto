import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CircleCheck, CircleX, Info, X } from "lucide-react";

type TipoToast = "sucesso" | "erro" | "info";

interface ToastItem {
  id: number;
  mensagem: string;
  tipo: TipoToast;
}

interface ToastContextValue {
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let proximoId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removerToast = useCallback((id: number) => {
    setToasts((atuais) => atuais.filter((toast) => toast.id !== id));
  }, []);

  const mostrarToast = useCallback(
    (mensagem: string, tipo: TipoToast = "info") => {
      const id = ++proximoId;
      setToasts((atuais) => [...atuais, { id, mensagem, tipo }]);
      window.setTimeout(() => removerToast(id), 5000);
    },
    [removerToast],
  );

  const valor = useMemo(() => ({ mostrarToast }), [mostrarToast]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div
        className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const Icone =
            toast.tipo === "sucesso"
              ? CircleCheck
              : toast.tipo === "erro"
                ? CircleX
                : Info;
          return (
            <div
              key={toast.id}
              role={toast.tipo === "erro" ? "alert" : "status"}
              className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-card ${
                toast.tipo === "erro"
                  ? "border-red-200 text-red-800"
                  : toast.tipo === "sucesso"
                    ? "border-emerald-200 text-emerald-800"
                    : "border-blue-200 text-brand-dark"
              }`}
            >
              <Icone className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm font-medium">{toast.mensagem}</p>
              <button
                type="button"
                onClick={() => removerToast(toast.id)}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast precisa ser usado dentro de ToastProvider.");
  }
  return contexto;
}
