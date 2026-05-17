# Сборка данных резюме для рендера

from collections import OrderedDict
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.domain.models import (
    Discipline,
    Education,
    EducationalProgram,
    Experience,
    ExperienceType,
    Language,
    PortfolioItem,
    Position,
    ProfessionalField,
    Resume,
    ResumeLanguage,
    ResumeSkill,
    ResumeStatus,
    Skill,
    SkillCategory,
    Template,
    User,
)


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}


def _is_image_filename(name: str) -> bool:
    lowered = name.lower()
    return any(lowered.endswith(ext) for ext in IMAGE_EXTS)


def _to_internal_minio_url(public_url: str) -> str:
    if not public_url:
        return public_url
    public = settings.MINIO_PUBLIC_ENDPOINT.rstrip("/")
    scheme = "https" if settings.MINIO_SECURE else "http"
    internal = f"{scheme}://{settings.MINIO_ENDPOINT}"
    if public and public_url.startswith(public):
        return internal + public_url[len(public):]
    return public_url


def build_resume_context(db: Session, resume: Resume, user: User) -> dict[str, Any]:
    position = db.get(Position, resume.position_id)
    field = db.get(ProfessionalField, position.field_id) if position else None
    template = db.get(Template, resume.template_id)
    status = db.get(ResumeStatus, resume.status_id)

    educations = []
    for edu in db.execute(
        select(Education).where(Education.resume_id == resume.resume_id)
    ).scalars():
        edu_program = db.get(EducationalProgram, edu.program_id)
        educations.append({
            "institution": edu.institution,
            "program_name": edu_program.program_name if edu_program else "",
            "start_year": edu.start_year,
            "graduation_year": edu.graduation_year,
        })

    experiences = []
    for exp in db.execute(
        select(Experience).where(Experience.resume_id == resume.resume_id)
    ).scalars():
        exp_type = db.get(ExperienceType, exp.type_id)
        discipline = db.get(Discipline, exp.discipline_id) if exp.discipline_id else None

        attached = db.execute(
            select(PortfolioItem).where(PortfolioItem.experience_id == exp.experience_id)
        ).scalars().all()
        images = []
        other_files = []
        for item in attached:
            entry = {
                "file_name": item.file_name,
                "storage_url": item.storage_url,
                "fetch_url": _to_internal_minio_url(item.storage_url),
            }
            if _is_image_filename(item.file_name):
                images.append(entry)
            else:
                other_files.append(entry)

        experiences.append({
            "project_name": exp.project_name,
            "description": exp.description or "",
            "type_name": exp_type.type_name if exp_type else "",
            "discipline_name": discipline.discipline_name if discipline else None,
            "images": images,
            "other_files": other_files,
        })

    grouped: OrderedDict[str, list[dict]] = OrderedDict()
    for rs in db.execute(
        select(ResumeSkill).where(ResumeSkill.resume_id == resume.resume_id)
    ).scalars():
        skill = db.get(Skill, rs.skill_id)
        if not skill:
            continue
        category = db.get(SkillCategory, skill.category_id)
        cat_name = category.category_name if category else "Прочее"
        grouped.setdefault(cat_name, []).append({
            "skill_name": skill.skill_name,
            "skill_level": rs.skill_level,
        })

    languages = []
    for rl in db.execute(
        select(ResumeLanguage).where(ResumeLanguage.resume_id == resume.resume_id)
    ).scalars():
        lang = db.get(Language, rl.language_id)
        if lang:
            languages.append({
                "language_name": lang.language_name,
                "proficiency": rl.proficiency,
            })

    if user and user.full_name:
        owner_full_name = user.full_name
        owner_email = user.email or resume.owner_email or ""
        owner_phone = user.phone or ""
    else:
        owner_full_name = resume.owner_full_name or ""
        owner_email = resume.owner_email or ""
        owner_phone = ""

    photo_url = user.photo_url if user else None
    photo_fetch_url = _to_internal_minio_url(photo_url) if photo_url else None

    return {
        "owner": {
            "full_name": owner_full_name,
            "email": owner_email,
            "phone": owner_phone,
            "photo_url": photo_url,
            "photo_fetch_url": photo_fetch_url,
        },
        "resume": {
            "title": resume.title,
            "creation_date": resume.creation_date.strftime("%d.%m.%Y") if resume.creation_date else "",
            "status": status.status_name if status else "",
            "position_name": position.position_name if position else "",
            "field_name": field.field_name if field else "",
            "company": position.company if position else None,
            "template_name": template.template_name if template else "",
        },
        "educations": educations,
        "experiences": experiences,
        "skills_by_category": grouped,
        "languages": languages,
    }
