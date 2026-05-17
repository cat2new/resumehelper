# Эндпоинты справочников. Требуют авторизации

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import (
    Discipline,
    EducationalProgram,
    ExperienceType,
    FileFormat,
    Language,
    ProfessionalField,
    ResumeStatus,
    SkillCategory,
    User,
)
from app.domain.schemas.dictionaries import (
    DisciplineOut,
    EducationalProgramOut,
    ExperienceTypeOut,
    FileFormatOut,
    LanguageOut,
    ProfessionalFieldOut,
    ResumeStatusOut,
    SkillCategoryOut,
)

router = APIRouter(
    prefix="/api/dictionaries",
    tags=["dictionaries"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/programs", response_model=list[EducationalProgramOut])
def list_programs(db: Session = Depends(get_db)):
    return db.execute(select(EducationalProgram).order_by(EducationalProgram.program_name)).scalars().all()


@router.get("/professional-fields", response_model=list[ProfessionalFieldOut])
def list_fields(db: Session = Depends(get_db)):
    return db.execute(select(ProfessionalField).order_by(ProfessionalField.field_name)).scalars().all()


@router.get("/skill-categories", response_model=list[SkillCategoryOut])
def list_skill_categories(db: Session = Depends(get_db)):
    return db.execute(select(SkillCategory).order_by(SkillCategory.category_name)).scalars().all()


@router.get("/experience-types", response_model=list[ExperienceTypeOut])
def list_experience_types(db: Session = Depends(get_db)):
    return db.execute(select(ExperienceType).order_by(ExperienceType.type_name)).scalars().all()


@router.get("/disciplines", response_model=list[DisciplineOut])
def list_disciplines(db: Session = Depends(get_db)):
    return db.execute(select(Discipline).order_by(Discipline.discipline_name)).scalars().all()


@router.get("/file-formats", response_model=list[FileFormatOut])
def list_file_formats(db: Session = Depends(get_db)):
    return db.execute(select(FileFormat).order_by(FileFormat.extension)).scalars().all()


@router.get("/resume-statuses", response_model=list[ResumeStatusOut])
def list_statuses(db: Session = Depends(get_db)):
    return db.execute(select(ResumeStatus).order_by(ResumeStatus.status_id)).scalars().all()


@router.get("/languages", response_model=list[LanguageOut])
def list_languages(db: Session = Depends(get_db)):
    return db.execute(select(Language).order_by(Language.language_name)).scalars().all()
