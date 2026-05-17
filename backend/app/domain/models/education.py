# Модель образования в резюме

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.domain.models.dictionaries import EducationalProgram
    from app.domain.models.resume import Resume


class Education(Base):
    __tablename__ = "education"

    education_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    institution: Mapped[str] = mapped_column(String(100), nullable=False, default="НИУ ВШЭ")
    program_id: Mapped[int] = mapped_column(
        ForeignKey("educational_program.program_id"), nullable=False
    )
    start_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    graduation_year: Mapped[int] = mapped_column(Integer, nullable=False)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resume.resume_id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    program: Mapped["EducationalProgram"] = relationship()
    resume: Mapped["Resume"] = relationship(back_populates="educations")
