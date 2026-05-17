# Каталог навыков

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import ResumeSkill, Skill, SkillCategory, User
from app.domain.schemas.resume import SkillCreate, SkillOut, SkillUpdate

router = APIRouter(prefix="/api/skills", tags=["skills"])


def _to_out(skill: Skill, current_user_id: int) -> SkillOut:
    return SkillOut(
        skill_id=skill.skill_id,
        skill_name=skill.skill_name,
        category_id=skill.category_id,
        is_custom=skill.user_id == current_user_id,
    )


@router.get("", response_model=list[SkillOut])
def list_skills(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.execute(
        select(Skill)
        .where(or_(Skill.user_id.is_(None), Skill.user_id == user.user_id))
        .order_by(Skill.skill_name)
    ).scalars().all()
    return [_to_out(s, user.user_id) for s in rows]


@router.post("", response_model=SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(
    payload: SkillCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(SkillCategory, payload.category_id):
        raise HTTPException(status_code=400, detail="Категория не найдена")


    existing = db.execute(
        select(Skill).where(
            Skill.skill_name == payload.skill_name,
            or_(Skill.user_id.is_(None), Skill.user_id == user.user_id),
        )
    ).scalar_one_or_none()
    if existing:
        return _to_out(existing, user.user_id)

    skill = Skill(
        skill_name=payload.skill_name,
        category_id=payload.category_id,
        user_id=user.user_id,  # личный навык
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return _to_out(skill, user.user_id)


@router.patch("/{skill_id}", response_model=SkillOut)
def update_skill(
    skill_id: int,
    payload: SkillUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")
    if skill.user_id is None:
        raise HTTPException(
            status_code=403,
            detail="Базовый навык нельзя редактировать",
        )
    if skill.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Навык не найден")

    if payload.skill_name is not None:
        clash = db.execute(
            select(Skill).where(
                Skill.skill_name == payload.skill_name,
                Skill.skill_id != skill_id,
                or_(Skill.user_id.is_(None), Skill.user_id == user.user_id),
            )
        ).scalar_one_or_none()
        if clash:
            raise HTTPException(status_code=409, detail="Такой навык уже есть")
        skill.skill_name = payload.skill_name

    if payload.category_id is not None:
        if not db.get(SkillCategory, payload.category_id):
            raise HTTPException(status_code=400, detail="Категория не найдена")
        skill.category_id = payload.category_id

    db.commit()
    db.refresh(skill)
    return _to_out(skill, user.user_id)


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")
    if skill.user_id is None:
        raise HTTPException(status_code=403, detail="Базовый навык нельзя удалить")
    if skill.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Навык не найден")

    for rs in db.execute(
        select(ResumeSkill).where(ResumeSkill.skill_id == skill_id)
    ).scalars().all():
        db.delete(rs)
    db.delete(skill)
    db.commit()
