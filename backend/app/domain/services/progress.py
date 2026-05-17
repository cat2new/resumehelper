# Подсчёт % заполненности резюме

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.models import Education, Experience, Resume, ResumeSkill


def calculate_progress(db: Session, resume: Resume) -> int:
    score = 0

    if resume.title and resume.position_id:
        score += 25

    has_edu = db.execute(
        select(Education.education_id).where(Education.resume_id == resume.resume_id).limit(1)
    ).first()
    if has_edu:
        score += 25

    has_exp = db.execute(
        select(Experience.experience_id).where(Experience.resume_id == resume.resume_id).limit(1)
    ).first()
    if has_exp:
        score += 25

    has_skill = db.execute(
        select(ResumeSkill.skill_id).where(ResumeSkill.resume_id == resume.resume_id).limit(1)
    ).first()
    if has_skill:
        score += 25

    return score
