# Профиль пользователя: ФИО, контакты, фото

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.storage import get_storage
from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import User
from app.domain.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["profile"])

MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 МБ
ALLOWED_PHOTO_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def _to_out(user: User) -> ProfileOut:
    is_complete = bool(
        user.full_name and user.phone and user.email and user.photo_url
    )
    return ProfileOut(
        user_id=user.user_id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        photo_url=user.photo_url,
        is_complete=is_complete,
    )


@router.get("", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user)):
    return _to_out(user)


@router.put("", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.email != user.email:
        clash = db.execute(
            select(User).where(User.email == payload.email, User.user_id != user.user_id)
        ).scalar_one_or_none()
        if clash:
            raise HTTPException(status_code=409, detail="Этот email уже занят")

    user.full_name = payload.full_name
    user.phone = payload.phone
    user.email = payload.email
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.post("/photo", response_model=ProfileOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Фото слишком большое (макс {MAX_PHOTO_SIZE // 1024 // 1024} МБ)",
        )

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_PHOTO_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Поддерживаются только: {', '.join(sorted(ALLOWED_PHOTO_EXTS))}",
        )

    storage = get_storage()
    if user.photo_storage_key:
        try:
            storage.delete_file(user.photo_storage_key)
        except Exception:
            pass

    storage_key, public_url = storage.upload_file(
        file_bytes=contents,
        original_filename=file.filename or "photo",
        content_type=file.content_type or "image/jpeg",
        prefix="profile",
    )

    user.photo_url = public_url
    user.photo_storage_key = storage_key
    db.commit()
    db.refresh(user)
    return _to_out(user)


@router.delete("/photo", response_model=ProfileOut)
def delete_photo(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.photo_storage_key:
        try:
            get_storage().delete_file(user.photo_storage_key)
        except Exception:
            pass
    user.photo_url = None
    user.photo_storage_key = None
    db.commit()
    db.refresh(user)
    return _to_out(user)
