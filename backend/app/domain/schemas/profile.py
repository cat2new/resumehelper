# Схемы профиля пользователя

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    phone: str
    email: str
    photo_url: str | None
    is_complete: bool  # все обязательные поля заполнены, и есть фото


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=30)
    email: EmailStr
