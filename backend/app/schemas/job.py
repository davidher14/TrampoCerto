from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class JobFields(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str = Field(min_length=1)
    requirements: str = Field(min_length=1)
    area: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=2, max_length=2)
    work_mode: Literal["onsite", "hybrid", "remote"]
    contract_type: Literal[
        "clt", "pj", "internship", "temporary", "freelance", "apprentice"
    ]
    salary_min: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    salary_max: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    status: Literal["draft", "open"] = "draft"

    @model_validator(mode="after")
    def validar_faixa_salarial(self):
        if self.salary_max is not None and self.salary_max < self.salary_min:
            raise ValueError("O salário máximo não pode ser menor que o mínimo.")
        return self


class JobCreate(JobFields):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, min_length=1)
    requirements: str | None = Field(default=None, min_length=1)
    area: str | None = Field(default=None, min_length=1, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    work_mode: Literal["onsite", "hybrid", "remote"] | None = None
    contract_type: Literal[
        "clt", "pj", "internship", "temporary", "freelance", "apprentice"
    ] | None = None
    salary_min: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    salary_max: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    status: Literal["draft", "open"] | None = None

    @model_validator(mode="before")
    @classmethod
    def rejeitar_nulos_em_campos_obrigatorios(cls, values):
        if isinstance(values, dict):
            campos_obrigatorios = {
                "title",
                "description",
                "requirements",
                "area",
                "city",
                "state",
                "work_mode",
                "contract_type",
                "salary_min",
                "status",
            }
            nulos = [campo for campo in campos_obrigatorios if campo in values and values[campo] is None]
            if nulos:
                raise ValueError(f"Estes campos não podem ser nulos: {', '.join(sorted(nulos))}.")
        return values

    @field_validator("salary_min", mode="before")
    @classmethod
    def validar_salario_minimo(cls, value):
        if value is None:
            raise ValueError("O salário mínimo é obrigatório.")
        return value

    @model_validator(mode="after")
    def validar_faixa_salarial(self):
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError("O salário máximo não pode ser menor que o mínimo.")
        return self


class CompanyPublic(BaseModel):
    name: str
    logo_url: str | None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    title: str
    description: str
    requirements: str
    area: str
    city: str
    state: str
    work_mode: str
    contract_type: str
    salary_min: Decimal
    salary_max: Decimal | None
    salary_currency: str
    status: str
    created_at: datetime
    company: CompanyPublic


class JobListItem(JobOut):
    application_count: int = 0

