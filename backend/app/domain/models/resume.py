# Модели резюме и его связей с навыками и языками

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.domain.models.dictionaries import Language, ResumeStatus
    from app.domain.models.education import Education
    from app.domain.models.experience import Experience
    from app.domain.models.position import Position
    from app.domain.models.skill import Skill
    from app.domain.models.template import Template


class Resume(Base):
    __tablename__ = "resume"

    resume_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    owner_full_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    owner_email: Mapped[str] = mapped_column(String(100), nullable=False, default="")

    title: Mapped[str] = mapped_column(String(100), nullable=False)
    creation_date: Mapped[date] = mapped_column(
        Date, nullable=False, server_default=func.current_date()
    )
    position_id: Mapped[int] = mapped_column(ForeignKey("position.position_id"), nullable=False)
    template_id: Mapped[int] = mapped_column(ForeignKey("template.template_id"), nullable=False)
    status_id: Mapped[int] = mapped_column(ForeignKey("resume_status.status_id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    position: Mapped["Position"] = relationship()
    template: Mapped["Template"] = relationship()
    status: Mapped["ResumeStatus"] = relationship()
    educations: Mapped[list["Education"]] = relationship(
        back_populates="resume", cascade="all, delete-orphan"
    )
    experiences: Mapped[list["Experience"]] = relationship(
        back_populates="resume", cascade="all, delete-orphan"
    )
    skills: Mapped[list["ResumeSkill"]] = relationship(
        back_populates="resume", cascade="all, delete-orphan"
    )
    languages: Mapped[list["ResumeLanguage"]] = relationship(
        back_populates="resume", cascade="all, delete-orphan"
    )


class ResumeSkill(Base):
    """Связь навыка с резюме + уровень владения."""

    __tablename__ = "resume_skill"

    resume_id: Mapped[int] = mapped_column(
        ForeignKey("resume.resume_id", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[int] = mapped_column(ForeignKey("skill.skill_id"), primary_key=True)
    skill_level: Mapped[str] = mapped_column(String(20), nullable=False, default="Средний")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    resume: Mapped["Resume"] = relationship(back_populates="skills")
    skill: Mapped["Skill"] = relationship()


class ResumeLanguage(Base):
    """Язык, указанный в резюме, с уровнем владения (A1..C2)."""

    __tablename__ = "resume_language"

    resume_id: Mapped[int] = mapped_column(
        ForeignKey("resume.resume_id", ondelete="CASCADE"), primary_key=True
    )
    language_id: Mapped[int] = mapped_column(
        ForeignKey("language.language_id"), primary_key=True
    )
    proficiency: Mapped[str] = mapped_column(String(10), nullable=False, default="B2")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    resume: Mapped["Resume"] = relationship(back_populates="languages")
    language: Mapped["Language"] = relationship()
