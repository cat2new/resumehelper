# Модель элемента портфолио

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base

if TYPE_CHECKING:
    from app.domain.models.dictionaries import FileFormat
    from app.domain.models.experience import Experience


class PortfolioItem(Base):
    __tablename__ = "portfolio_item"

    portfolio_item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_url: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    experience_id: Mapped[int | None] = mapped_column(
        ForeignKey("experience.experience_id"), nullable=True
    )
    format_id: Mapped[int] = mapped_column(ForeignKey("file_format.format_id"), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    file_format: Mapped["FileFormat"] = relationship()
    experience: Mapped["Experience | None"] = relationship(back_populates="portfolio_items")
