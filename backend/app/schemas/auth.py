from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def validar_senha(senha: str) -> str:
    if len(senha) < 10:
        raise ValueError("A senha deve ter pelo menos 10 caracteres.")
    if not any(char.isalpha() for char in senha) or not any(char.isdigit() for char in senha):
        raise ValueError("A senha deve conter letras e números.")
    return senha


class CandidateRegistration(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)
    full_name: str = Field(min_length=2, max_length=180)

    @field_validator("password")
    @classmethod
    def validar_senha_forte(cls, senha: str) -> str:
        return validar_senha(senha)

    @field_validator("full_name")
    @classmethod
    def validar_nome(cls, nome: str) -> str:
        nome = nome.strip()
        if len(nome) < 2:
            raise ValueError("Informe seu nome completo.")
        return nome


class CompanyRegistration(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)
    company_name: str = Field(min_length=2, max_length=180)
    cnpj: str = Field(min_length=14, max_length=18)

    @field_validator("password")
    @classmethod
    def validar_senha_forte(cls, senha: str) -> str:
        return validar_senha(senha)

    @field_validator("company_name")
    @classmethod
    def validar_nome_empresa(cls, nome: str) -> str:
        nome = nome.strip()
        if len(nome) < 2:
            raise ValueError("Informe o nome da empresa.")
        return nome

    @field_validator("cnpj")
    @classmethod
    def validar_cnpj(cls, cnpj: str) -> str:
        numeros = "".join(char for char in cnpj if char.isdigit())
        if len(numeros) != 14 or len(set(numeros)) == 1:
            raise ValueError("Informe um CNPJ válido com 14 dígitos.")

        def calcular_digito(base: str, pesos: list[int]) -> str:
            soma = sum(int(numero) * peso for numero, peso in zip(base, pesos))
            resto = soma % 11
            return str(0 if resto < 2 else 11 - resto)

        primeiro = calcular_digito(numeros[:12], [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
        segundo = calcular_digito(
            numeros[:12] + primeiro,
            [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
        )
        if numeros[-2:] != primeiro + segundo:
            raise ValueError("Informe um CNPJ válido.")
        return numeros


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserSummary
