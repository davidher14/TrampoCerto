class VagaNaoEncontrada(Exception):
    """A vaga não existe ou não pertence à empresa autenticada."""


class CandidaturaNaoEncontrada(Exception):
    """A candidatura não existe ou não pertence à empresa autenticada."""


class VagaIndisponivel(Exception):
    """A vaga não está aberta para receber candidaturas."""


class VagaEncerrada(Exception):
    """A vaga já foi encerrada e não aceita novos retornos."""


class RetornosPendentes(Exception):
    def __init__(self, candidatos: list[dict[str, int | str]]) -> None:
        self.candidatos = candidatos
        super().__init__("Há candidatos sem retorno registrado.")
