from datetime import date

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class ExperienceInput(BaseModel):
    company_name: str = Field(min_length=1, max_length=180)
    job_title: str = Field(min_length=1, max_length=180)
    description: str | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool = False


class ExperienceOut(ExperienceInput):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EducationInput(BaseModel):
    institution: str = Field(min_length=1, max_length=180)
    course: str = Field(min_length=1, max_length=180)
    degree_level: str = Field(min_length=1, max_length=80)
    start_date: date
    end_date: date | None = None


class EducationOut(EducationInput):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SkillInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    proficiency: str | None = Field(default=None, max_length=40)


class SkillOut(SkillInput):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LanguageInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    proficiency: str = Field(min_length=1, max_length=40)


class LanguageOut(LanguageInput):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CandidateProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=180)
    phone: str | None = Field(default=None, max_length=30)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    headline: str | None = Field(default=None, max_length=180)
    summary: str | None = None
    portfolio_url: HttpUrl | None = None
    linkedin_url: HttpUrl | None = None
    github_url: HttpUrl | None = None

    @field_validator("full_name")
    @classmethod
    def validar_nome_completo(cls, nome: str | None) -> str:
        if nome is None or len(nome.strip()) < 2:
            raise ValueError("Informe seu nome completo.")
        return nome.strip()


class CandidateProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    phone: str | None
    city: str | None
    state: str | None
    headline: str | None
    summary: str | None
    portfolio_url: str | None
    linkedin_url: str | None
    github_url: str | None
    has_resume: bool
    experiences: list[ExperienceOut]
    educations: list[EducationOut]
    skills: list[SkillOut]
    languages: list[LanguageOut]
    completion_percentage: int


class CandidateResumeUpdate(BaseModel):
    experiences: list[ExperienceInput] = Field(default_factory=list)
    educations: list[EducationInput] = Field(default_factory=list)
    skills: list[SkillInput] = Field(default_factory=list)
    languages: list[LanguageInput] = Field(default_factory=list)


class CompanyProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = None
    website: HttpUrl | None = None

    @field_validator("name")
    @classmethod
    def validar_nome_empresa(cls, nome: str | None) -> str:
        if nome is None or len(nome.strip()) < 2:
            raise ValueError("Informe o nome da empresa.")
        return nome.strip()


class CompanyProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    cnpj: str
    description: str | None
    website: str | None
    has_logo: bool
    logo_url: str | None


class PublicCompanyProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    website: str | None
    logo_url: str | None
