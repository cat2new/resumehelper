# Пользователь системы

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    password_salt: Mapped[str] = mapped_column(String(32), nullable=False)

    # Токен текущей сессии
    session_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)

    # Личный профиль
    full_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    phone: Mapped[str] = mapped_column(String(30), nullable=False, default="")
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    photo_storage_key: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Роль администратора (для сброса паролей пользователей)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )
