# Зависимости FastAPI для авторизованных эндпоинтов

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.domain.models import User


def get_current_user(
    x_session_token: str | None = Header(default=None, alias="X-Session-Token"),
    token_query: str | None = None,
    db: Session = Depends(get_db),
) -> User:

    token = x_session_token or token_query
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не авторизован",
        )

    user = db.execute(
        select(User).where(User.session_token == token)
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Сессия истекла или недействительна",
        )
    return user
