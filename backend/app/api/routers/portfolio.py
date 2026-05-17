# Портфолио: загрузка, список, удаление, привязка к опыту

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.storage import get_storage
from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import Experience, FileFormat, PortfolioItem, Resume, User
from app.domain.schemas.portfolio import PortfolioItemAttach, PortfolioItemOut

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 МБ


def _experience_belongs_to_user(db: Session, experience_id: int, user_id: int) -> bool:
    exp = db.get(Experience, experience_id)
    if not exp:
        return False
    resume = db.get(Resume, exp.resume_id)
    return bool(resume and resume.user_id == user_id)


@router.get("", response_model=list[PortfolioItemOut])
def list_portfolio(
    experience_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    query = (
        select(PortfolioItem)
        .where(PortfolioItem.user_id == user.user_id)
        .order_by(PortfolioItem.created_at.desc())
    )
    if experience_id is not None:
        if experience_id == 0:
            query = query.where(PortfolioItem.experience_id.is_(None))
        else:
            query = query.where(PortfolioItem.experience_id == experience_id)
    return db.execute(query).scalars().all()


@router.post("/upload", response_model=PortfolioItemOut, status_code=status.HTTP_201_CREATED)
async def upload_portfolio_item(
    file: UploadFile = File(...),
    experience_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Файл слишком большой (макс {MAX_FILE_SIZE // 1024 // 1024} МБ)",
        )

    ext = Path(file.filename or "").suffix.lower() or ".bin"
    file_format = db.execute(
        select(FileFormat).where(FileFormat.extension == ext)
    ).scalar_one_or_none()
    if not file_format:
        file_format = FileFormat(extension=ext)
        db.add(file_format)
        db.commit()
        db.refresh(file_format)

    if experience_id is not None and not _experience_belongs_to_user(db, experience_id, user.user_id):
        raise HTTPException(status_code=400, detail="Опыт не найден")

    storage = get_storage()
    storage_key, public_url = storage.upload_file(
        file_bytes=contents,
        original_filename=file.filename or "file",
        content_type=file.content_type or "application/octet-stream",
        prefix="portfolio",
    )

    item = PortfolioItem(
        user_id=user.user_id,
        file_name=file.filename or "file",
        storage_url=public_url,
        storage_key=storage_key,
        experience_id=experience_id,
        format_id=file_format.format_id,
        file_size=len(contents),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=PortfolioItemOut)
def attach_to_experience(
    item_id: int,
    payload: PortfolioItemAttach,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = db.get(PortfolioItem, item_id)
    if not item or item.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Файл не найден")
    if payload.experience_id is not None and not _experience_belongs_to_user(
        db, payload.experience_id, user.user_id
    ):
        raise HTTPException(status_code=400, detail="Опыт не найден")
    item.experience_id = payload.experience_id
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = db.get(PortfolioItem, item_id)
    if not item or item.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if item.storage_key:
        try:
            get_storage().delete_file(item.storage_key)
        except Exception:
            pass

    db.delete(item)
    db.commit()
