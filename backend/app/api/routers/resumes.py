# CRUD резюме и вложенных сущностей

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import (
    Education,
    EducationalProgram,
    Experience,
    Language,
    Position,
    Resume,
    ResumeLanguage,
    ResumeSkill,
    ResumeStatus,
    Skill,
    SkillCategory,
    Template,
    User,
)
from app.domain.schemas.resume import (
    EducationCreate,
    EducationOut,
    EducationUpdate,
    ExperienceCreate,
    ExperienceOut,
    ExperienceUpdate,
    PositionOut,
    ResumeCreate,
    ResumeDetail,
    ResumeLanguageIn,
    ResumeLanguageOut,
    ResumeListItem,
    ResumeSkillIn,
    ResumeSkillOut,
    ResumeUpdate,
    TemplateOut,
)
from app.domain.services.progress import calculate_progress

router = APIRouter(prefix="/api/resumes", tags=["resumes"])


def _get_or_404(db: Session, resume_id: int, user: User) -> Resume:
    """Достаёт резюме, проверяет что оно принадлежит текущему юзеру."""
    resume = db.get(Resume, resume_id)
    if not resume or resume.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Резюме не найдено")
    return resume


def _build_detail(db: Session, resume: Resume) -> ResumeDetail:
    position = db.get(Position, resume.position_id)
    template = db.get(Template, resume.template_id)
    status_obj = db.get(ResumeStatus, resume.status_id)

    educations = db.execute(
        select(Education).where(Education.resume_id == resume.resume_id)
    ).scalars().all()

    experiences = db.execute(
        select(Experience).where(Experience.resume_id == resume.resume_id)
    ).scalars().all()

    # Навыки
    skill_rows = db.execute(
        select(ResumeSkill).where(ResumeSkill.resume_id == resume.resume_id)
    ).scalars().all()
    skills_out: list[ResumeSkillOut] = []
    for rs in skill_rows:
        skill = db.get(Skill, rs.skill_id)
        if not skill:
            continue
        category = db.get(SkillCategory, skill.category_id)
        skills_out.append(
            ResumeSkillOut(
                skill_id=skill.skill_id,
                skill_name=skill.skill_name,
                category_name=category.category_name if category else "",
                skill_level=rs.skill_level,
            )
        )

    # Языки
    lang_rows = db.execute(
        select(ResumeLanguage).where(ResumeLanguage.resume_id == resume.resume_id)
    ).scalars().all()
    languages_out: list[ResumeLanguageOut] = []
    for rl in lang_rows:
        lang = db.get(Language, rl.language_id)
        if not lang:
            continue
        languages_out.append(
            ResumeLanguageOut(
                language_id=lang.language_id,
                language_name=lang.language_name,
                proficiency=rl.proficiency,
            )
        )

    return ResumeDetail(
        resume_id=resume.resume_id,
        title=resume.title,
        owner_full_name=resume.owner_full_name,
        owner_email=resume.owner_email,
        creation_date=resume.creation_date,
        status_id=resume.status_id,
        status_name=status_obj.status_name if status_obj else "",
        position=PositionOut.model_validate(position),
        template=TemplateOut.model_validate(template),
        educations=[EducationOut.model_validate(e) for e in educations],
        experiences=[ExperienceOut.model_validate(e) for e in experiences],
        skills=skills_out,
        languages=languages_out,
        progress=calculate_progress(db, resume),
        created_at=resume.created_at,
    )


# CRUD

@router.get("", response_model=list[ResumeListItem])
def list_resumes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(
        select(Resume)
        .where(Resume.user_id == user.user_id)
        .order_by(Resume.created_at.desc())
    ).scalars().all()
    items = []
    for r in rows:
        position = db.get(Position, r.position_id)
        template = db.get(Template, r.template_id)
        st = db.get(ResumeStatus, r.status_id)
        items.append(
            ResumeListItem(
                resume_id=r.resume_id,
                title=r.title,
                creation_date=r.creation_date,
                status_name=st.status_name if st else "",
                position_name=position.position_name if position else "",
                template_name=template.template_name if template else "",
                progress=calculate_progress(db, r),
            )
        )
    return items


@router.post("", response_model=ResumeDetail, status_code=status.HTTP_201_CREATED)
def create_resume(
    payload: ResumeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Должность должна принадлежать текущему юзеру
    position = db.get(Position, payload.position_id)
    if not position or position.user_id != user.user_id:
        raise HTTPException(status_code=400, detail="Должность не найдена")
    if not db.get(Template, payload.template_id):
        raise HTTPException(status_code=400, detail="Шаблон не найден")

    draft_status = db.execute(
        select(ResumeStatus).where(ResumeStatus.status_name == "Черновик")
    ).scalar_one()

    resume = Resume(
        user_id=user.user_id,
        title=payload.title,
        owner_full_name=payload.owner_full_name,
        owner_email=payload.owner_email,
        position_id=payload.position_id,
        template_id=payload.template_id,
        status_id=draft_status.status_id,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return _build_detail(db, resume)


@router.get("/{resume_id}", response_model=ResumeDetail)
def get_resume(resume_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    resume = _get_or_404(db, resume_id, user)
    return _build_detail(db, resume)


@router.patch("/{resume_id}", response_model=ResumeDetail)
def update_resume(
    resume_id: int,
    payload: ResumeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = _get_or_404(db, resume_id, user)

    if payload.title is not None:
        resume.title = payload.title
    if payload.owner_full_name is not None:
        resume.owner_full_name = payload.owner_full_name
    if payload.owner_email is not None:
        resume.owner_email = payload.owner_email
    if payload.position_id is not None:
        pos = db.get(Position, payload.position_id)
        if not pos or pos.user_id != user.user_id:
            raise HTTPException(status_code=400, detail="Должность не найдена")
        resume.position_id = payload.position_id
    if payload.template_id is not None:
        if not db.get(Template, payload.template_id):
            raise HTTPException(status_code=400, detail="Шаблон не найден")
        resume.template_id = payload.template_id
    if payload.status_id is not None:
        if not db.get(ResumeStatus, payload.status_id):
            raise HTTPException(status_code=400, detail="Статус не найден")
        resume.status_id = payload.status_id

    db.commit()
    db.refresh(resume)
    return _build_detail(db, resume)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = _get_or_404(db, resume_id, user)
    db.delete(resume)
    db.commit()


# Образования

@router.post(
    "/{resume_id}/educations", response_model=EducationOut, status_code=status.HTTP_201_CREATED
)
def add_education(
    resume_id: int,
    payload: EducationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_or_404(db, resume_id, user)
    if not db.get(EducationalProgram, payload.program_id):
        raise HTTPException(status_code=400, detail="Программа не найдена")

    edu = Education(
        institution=payload.institution,
        program_id=payload.program_id,
        start_year=payload.start_year,
        graduation_year=payload.graduation_year,
        resume_id=resume_id,
    )
    db.add(edu)
    db.commit()
    db.refresh(edu)
    return edu


@router.patch("/{resume_id}/educations/{education_id}", response_model=EducationOut)
def update_education(
    resume_id: int,
    education_id: int,
    payload: EducationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_or_404(db, resume_id, user)
    edu = db.get(Education, education_id)
    if not edu or edu.resume_id != resume_id:
        raise HTTPException(status_code=404, detail="Образование не найдено")

    if payload.institution is not None:
        edu.institution = payload.institution
    if payload.program_id is not None:
        if not db.get(EducationalProgram, payload.program_id):
            raise HTTPException(status_code=400, detail="Программа не найдена")
        edu.program_id = payload.program_id
    if payload.graduation_year is not None:
        edu.graduation_year = payload.graduation_year
    if "start_year" in payload.model_fields_set:
        edu.start_year = payload.start_year

    db.commit()
    db.refresh(edu)
    return edu


@router.delete("/{resume_id}/educations/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    resume_id: int,
    education_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_or_404(db, resume_id, user)
    edu = db.get(Education, education_id)
    if not edu or edu.resume_id != resume_id:
        raise HTTPException(status_code=404, detail="Образование не найдено")
    db.delete(edu)
    db.commit()


# Опыт

@router.post(
    "/{resume_id}/experiences",
    response_model=ExperienceOut,
    status_code=status.HTTP_201_CREATED,
)
def add_experience(
    resume_id: int,
    payload: ExperienceCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_or_404(db, resume_id, user)
    exp = Experience(
        project_name=payload.project_name,
        description=payload.description,
        type_id=payload.type_id,
        discipline_id=payload.discipline_id,
        resume_id=resume_id,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.patch("/{resume_id}/experiences/{experience_id}", response_model=ExperienceOut)
def update_experience(
    resume_id: int,
    experience_id: int,
    payload: ExperienceUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_or_404(db, resume_id, user)
    exp = db.get(Experience, experience_id)
    if not exp or exp.resume_id != resume_id:
        raise HTTPException(status_code=404, detail="Опыт не найден")

    if payload.project_name is not None:
        exp.project_name = payload.project_name
    if payload.description is not None:
        exp.description = payload.description
    if payload.type_id is not None:
        exp.type_id = payload.type_id
    if payload.discipline_id is not None:
        exp.discipline_id = payload.discipline_id

    db.commit()
    db.refresh(exp)
    return exp


@router.delete(
    "/{resume_id}/experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_experience(
    resume_id: int,
    experience_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_or_404(db, resume_id, user)
    exp = db.get(Experience, experience_id)
    if not exp or exp.resume_id != resume_id:
        raise HTTPException(status_code=404, detail="Опыт не найден")
    db.delete(exp)
    db.commit()


# Навыки

@router.put("/{resume_id}/skills", response_model=list[ResumeSkillOut])
def set_resume_skills(
    resume_id: int,
    skills: list[ResumeSkillIn],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = _get_or_404(db, resume_id, user)

    for rs in db.execute(
        select(ResumeSkill).where(ResumeSkill.resume_id == resume.resume_id)
    ).scalars().all():
        db.delete(rs)

    for s in skills:
        skill = db.get(Skill, s.skill_id)
        # Допустимы общие (user_id IS NULL) и собственные навыки текущего юзера
        if not skill or (skill.user_id is not None and skill.user_id != user.user_id):
            raise HTTPException(status_code=400, detail=f"Навык {s.skill_id} не найден")
        db.add(
            ResumeSkill(
                resume_id=resume.resume_id, skill_id=s.skill_id, skill_level=s.skill_level
            )
        )

    db.commit()
    return _build_detail(db, resume).skills


# Языки

@router.put("/{resume_id}/languages", response_model=list[ResumeLanguageOut])
def set_resume_languages(
    resume_id: int,
    languages: list[ResumeLanguageIn],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume = _get_or_404(db, resume_id, user)

    for rl in db.execute(
        select(ResumeLanguage).where(ResumeLanguage.resume_id == resume.resume_id)
    ).scalars().all():
        db.delete(rl)

    for lang_in in languages:
        if not db.get(Language, lang_in.language_id):
            raise HTTPException(status_code=400, detail=f"Язык {lang_in.language_id} не найден")
        db.add(
            ResumeLanguage(
                resume_id=resume.resume_id,
                language_id=lang_in.language_id,
                proficiency=lang_in.proficiency,
            )
        )

    db.commit()
    return _build_detail(db, resume).languages
