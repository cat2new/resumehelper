# Регистрация, вход и выход пользователя

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import User
from app.domain.schemas.auth import CurrentUserOut, LoginRequest, LoginResponse, RegisterRequest
from app.infrastructure.security import hash_password, make_salt, make_session_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> LoginResponse:
    existing = db.execute(
        select(User).where(User.email == payload.email)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email уже зарегистрирован",
        )

    salt = make_salt()
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password, salt),
        password_salt=salt,
        full_name=payload.full_name or "",
        phone="",
        session_token=make_session_token(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return LoginResponse(
        user_id=user.user_id,
        email=user.email,
        session_token=user.session_token or "",
        full_name=user.full_name,
        message="Регистрация прошла успешно!",
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Проверяет логин/пароль, обновляет токен сессии."""
    user = db.execute(
        select(User).where(User.email == payload.login)
    ).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_salt, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )

    user.session_token = make_session_token()
    db.commit()
    db.refresh(user)

    return LoginResponse(
        user_id=user.user_id,
        email=user.email,
        session_token=user.session_token or "",
        full_name=user.full_name,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Зануляет токен — пользователь больше не сможет ходить с этим токеном."""
    user.session_token = None
    db.commit()


@router.get("/me", response_model=CurrentUserOut)
def me(user: User = Depends(get_current_user)):
    """Кто я сейчас? Используется фронтом для проверки токена при загрузке."""
    return user
