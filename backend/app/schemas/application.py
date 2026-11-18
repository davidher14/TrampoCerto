from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.job import JobOut


class ApplicationCreate(BaseModel):
    cover_letter: str | None = Field(default=None, max_length=10000)


class FeedbackCreate(BaseModel):
    status: Literal["analysis", "interview", "approved", "rejected"]
    message: str = Field(min_length=5, max_length=10000)

    @field_validator("message")
    @classmethod
    def validar_mensagem(cls, mensagem: str) -> str:
        mensagem = mensagem.strip()
        if len(mensagem) < 5:
            raise ValueError("A mensagem de retorno deve ter pelo menos cinco caracteres.")
        return mensagem


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    message: str
    created_at: datetime


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    candidate_id: int
    cover_letter: str | None
    status: str
    applied_at: datetime
    updated_at: datetime
    job: JobOut
    feedbacks: list[FeedbackOut]


class CompanyApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    candidate_name: str
    candidate_email: str
    headline: str | None
    city: str | None
    state: str | None
    status: str
    applied_at: datetime
    cover_letter: str | None
    has_resume: bool
    feedbacks: list[FeedbackOut]


class CloseJobResult(BaseModel):
    job_id: int
    status: str
    message: str

