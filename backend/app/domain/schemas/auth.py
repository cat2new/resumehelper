# Схемы регистрации, входа и текущего пользователя

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    full_name: str = Field(default="", max_length=100)


class LoginRequest(BaseModel):
    login: EmailStr
    password: str


class LoginResponse(BaseModel):

    user_id: int
    email: str
    session_token: str
    full_name: str
    message: str = "Добро пожаловать!"


class CurrentUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    email: str
    full_name: str
