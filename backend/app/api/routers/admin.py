# Админская панель: поиск пользователей и сброс паролей

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.domain.models import User
from app.domain.schemas.admin import (
    ResetPasswordRequest,
    ResetPasswordResponse,
    UserSearchItem,
)
from app.infrastructure.database import get_db
from app.infrastructure.security import hash_password, make_salt

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserSearchItem])
def search_users(
    search: str = "",
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Ищем пользователей по подстроке в email или ФИО.
    Без параметра search вернёт всех (кроме самого админа).
    """
    query = select(User).where(User.user_id != admin.user_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(or_(User.email.ilike(pattern), User.full_name.ilike(pattern)))
    query = query.order_by(User.created_at.desc()).limit(50)
    return list(db.execute(query).scalars())


@router.post("/users/{user_id}/reset-password", response_model=ResetPasswordResponse)
def reset_user_password(
    user_id: int,
    payload: ResetPasswordRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Меняем пароль пользователя. Старая сессия пользователя при этом
    инвалидируется — после смены пароля он должен войти заново."""
    if user_id == admin.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Свой пароль администратору сменить здесь нельзя",
        )

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя менять пароль другого администратора",
        )

    new_salt = make_salt()
    user.password_salt = new_salt
    user.password_hash = hash_password(payload.new_password, new_salt)
    user.session_token = None
    db.commit()

    return ResetPasswordResponse(
        user_id=user.user_id,
        email=user.email,
        new_password=payload.new_password,
    )
