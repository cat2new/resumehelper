# Модель опыта в резюме

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.domain.models.dictionaries import Discipline, ExperienceType
    from app.domain.models.portfolio import PortfolioItem
    from app.domain.models.resume import Resume


class Experience(Base):
    __tablename__ = "experience"

    experience_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_id: Mapped[int] = mapped_column(ForeignKey("resume.resume_id"), nullable=False)
    type_id: Mapped[int] = mapped_column(ForeignKey("experience_type.type_id"), nullable=False)
    discipline_id: Mapped[int | None] = mapped_column(
        ForeignKey("discipline.discipline_id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    resume: Mapped["Resume"] = relationship(back_populates="experiences")
    experience_type: Mapped["ExperienceType"] = relationship()
    discipline: Mapped["Discipline | None"] = relationship()
    portfolio_items: Mapped[list["PortfolioItem"]] = relationship(
        back_populates="experience", cascade="all, delete-orphan"
    )
