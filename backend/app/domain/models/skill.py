# Модель навыка

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.domain.models.dictionaries import SkillCategory


class Skill(Base):
    __tablename__ = "skill"

    skill_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    skill_name: Mapped[str] = mapped_column(String(50), nullable=False)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("skill_category.category_id"), nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    category: Mapped["SkillCategory"] = relationship()
