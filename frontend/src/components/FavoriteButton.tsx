import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useToast } from "./ToastProvider";
import {
  candidateQueryKeys,
  removerVagaSalva,
  salvarVaga,
} from "../lib/candidateApi";
import { obterMensagemErro } from "../lib/api";

export function FavoriteButton({
  jobId,
  salva,
}: {
  jobId: number;
  salva: boolean;
}) {
  const queryClient = useQueryClient();
  const { mostrarToast } = useToast();
  const mutacao = useMutation({
    mutationFn: () =>
      salva ? removerVagaSalva(jobId) : salvarVaga(jobId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: candidateQueryKeys.savedJobs }),
        queryClient.invalidateQueries({ queryKey: candidateQueryKeys.jobs }),
      ]);
      mostrarToast(
        salva ? "Vaga removida das salvas." : "Vaga salva para ver depois.",
        "sucesso",
      );
    },
    onError: (erro) => {
      mostrarToast(
        obterMensagemErro(erro, "Não foi possível atualizar suas vagas salvas."),
        "erro",
      );
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutacao.mutate()}
      disabled={mutacao.isPending}
      aria-label={salva ? "Remover vaga das salvas" : "Salvar vaga"}
      aria-pressed={salva}
      title={salva ? "Remover das vagas salvas" : "Salvar vaga"}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-60 ${
        salva
          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "bg-slate-50 text-slate-500 hover:bg-brand-pale hover:text-brand"
      }`}
    >
      <Heart
        className={`h-5 w-5 ${salva ? "fill-current" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}
