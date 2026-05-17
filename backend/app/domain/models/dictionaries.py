# Справочные таблицы

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


class ProfessionalField(Base):
    __tablename__ = "professional_field"

    field_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)


class ResumeStatus(Base):
    __tablename__ = "resume_status"

    status_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    status_name: Mapped[str] = mapped_column(String(20), nullable=False, default="Черновик")


class SkillCategory(Base):
    __tablename__ = "skill_category"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_name: Mapped[str] = mapped_column(String(50), nullable=False)


class ExperienceType(Base):
    __tablename__ = "experience_type"

    type_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type_name: Mapped[str] = mapped_column(String(50), nullable=False)


class Discipline(Base):
    __tablename__ = "discipline"

    discipline_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    discipline_name: Mapped[str] = mapped_column(String(100), nullable=False)


class FileFormat(Base):
    __tablename__ = "file_format"

    format_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    extension: Mapped[str] = mapped_column(String(10), nullable=False)


class EducationalProgram(Base):
    __tablename__ = "educational_program"

    program_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    program_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    program_name: Mapped[str] = mapped_column(String(200), nullable=False)
    faculty: Mapped[str] = mapped_column(String(100), nullable=False)
    degree_level: Mapped[str] = mapped_column(String(50), nullable=False, default="Бакалавриат")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )


class Language(Base):
    """Справочник языков (для отдельной секции 'Языки' в резюме)."""

    __tablename__ = "language"

    language_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    language_name: Mapped[str] = mapped_column(String(50), nullable=False)
