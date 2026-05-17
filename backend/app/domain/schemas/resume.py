# Схемы резюме и связанных сущностей

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field



class SkillCreate(BaseModel):
    skill_name: str = Field(min_length=1, max_length=50)
    category_id: int


class SkillUpdate(BaseModel):
    skill_name: str | None = Field(default=None, min_length=1, max_length=50)
    category_id: int | None = None


class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    skill_id: int
    skill_name: str
    category_id: int
    is_custom: bool = False 


class ResumeSkillIn(BaseModel):
    skill_id: int
    skill_level: str = Field(default="Средний", max_length=20)


class ResumeSkillOut(BaseModel):
    skill_id: int
    skill_name: str
    category_name: str
    skill_level: str



class ResumeLanguageIn(BaseModel):
    language_id: int
    proficiency: str = Field(default="B2", max_length=10)


class ResumeLanguageOut(BaseModel):
    language_id: int
    language_name: str
    proficiency: str



class EducationCreate(BaseModel):
    institution: str = Field(default="НИУ ВШЭ", max_length=100)
    program_id: int
    start_year: int | None = Field(default=None, ge=1990, le=2100)
    graduation_year: int = Field(ge=1990, le=2100)


class EducationUpdate(BaseModel):
    institution: str | None = None
    program_id: int | None = None
    start_year: int | None = Field(default=None, ge=1990, le=2100)
    graduation_year: int | None = Field(default=None, ge=1990, le=2100)


class EducationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    education_id: int
    institution: str
    program_id: int
    start_year: int | None
    graduation_year: int



class ExperienceCreate(BaseModel):
    project_name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    type_id: int
    discipline_id: int | None = None


class ExperienceUpdate(BaseModel):
    project_name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    type_id: int | None = None
    discipline_id: int | None = None


class ExperienceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    experience_id: int
    project_name: str
    description: str | None
    type_id: int
    discipline_id: int | None



class PositionCreate(BaseModel):
    position_name: str = Field(min_length=1, max_length=100)
    field_id: int
    company: str | None = Field(default=None, max_length=100)


class PositionUpdate(BaseModel):
    position_name: str | None = Field(default=None, min_length=1, max_length=100)
    field_id: int | None = None
    company: str | None = Field(default=None, max_length=100)


class PositionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    position_id: int
    position_name: str
    field_id: int
    company: str | None



class TemplateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    template_id: int
    template_name: str
    description: str | None
    style_file: str



class ResumeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    owner_full_name: str = Field(min_length=1, max_length=100)
    owner_email: EmailStr
    position_id: int
    template_id: int


class ResumeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    owner_full_name: str | None = Field(default=None, min_length=1, max_length=100)
    owner_email: EmailStr | None = None
    position_id: int | None = None
    template_id: int | None = None
    status_id: int | None = None


class ResumeListItem(BaseModel):
    resume_id: int
    title: str
    creation_date: date
    status_name: str
    position_name: str
    template_name: str
    progress: int


class ResumeDetail(BaseModel):
    resume_id: int
    title: str
    owner_full_name: str
    owner_email: str
    creation_date: date
    status_id: int
    status_name: str
    position: PositionOut
    template: TemplateOut
    educations: list[EducationOut]
    experiences: list[ExperienceOut]
    skills: list[ResumeSkillOut]
    languages: list[ResumeLanguageOut]
    progress: int
    created_at: datetime
