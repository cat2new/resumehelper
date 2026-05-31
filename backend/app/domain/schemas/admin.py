# Схемы для админских эндпоинтов

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserSearchItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    email: str
    full_name: str
    phone: str
    is_admin: bool
    created_at: datetime


class ResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=100)


class ResetPasswordResponse(BaseModel):
    user_id: int
    email: str
    new_password: str
    message: str = "Пароль успешно сменён. Передайте его пользователю."
