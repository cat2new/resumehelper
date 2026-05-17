# Схемы справочников

from pydantic import BaseModel, ConfigDict


class ProfessionalFieldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    field_id: int
    field_name: str


class ResumeStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status_id: int
    status_name: str


class SkillCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    category_id: int
    category_name: str


class ExperienceTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    type_id: int
    type_name: str


class DisciplineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    discipline_id: int
    discipline_name: str


class FileFormatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    format_id: int
    extension: str


class EducationalProgramOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    program_id: int
    program_code: str
    program_name: str
    faculty: str
    degree_level: str


class LanguageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    language_id: int
    language_name: str
