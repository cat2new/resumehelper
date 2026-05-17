# Модель должности

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.domain.models.dictionaries import ProfessionalField


class Position(Base):
    __tablename__ = "position"

    position_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    position_name: Mapped[str] = mapped_column(String(100), nullable=False)
    field_id: Mapped[int] = mapped_column(
        ForeignKey("professional_field.field_id"), nullable=False
    )
    company: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    field: Mapped["ProfessionalField"] = relationship()
