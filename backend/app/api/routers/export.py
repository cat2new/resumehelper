# Синхронная генерация PDF/DOCX

from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.domain.models import Resume, User
from app.infrastructure.docx_renderer import render_resume_docx
from app.infrastructure.pdf_renderer import render_resume_pdf
from app.domain.services.resume_builder import build_resume_context

router = APIRouter(prefix="/api/resumes", tags=["export"])


def _safe_filename(title: str, ext: str) -> str:
    safe = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)
    safe = safe.strip().replace(" ", "_")[:60] or "resume"
    return f"{safe}.{ext}"


def _content_disposition(filename: str) -> str:
    """Собирает Content-Disposition, корректно обрабатывая кириллические имена.

    HTTP-заголовки по стандарту только latin-1. Для Unicode используем RFC 5987:
    Content-Disposition: attachment; filename="ascii_fallback"; filename*=UTF-8''<percent-encoded>
    """
    ascii_fallback = filename.encode("ascii", "replace").decode("ascii")
    encoded = quote(filename, safe="")
    return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{encoded}"


def _user_by_token(db: Session, token: str | None) -> User:
    """Авторизация по query-параметру token (нужно для прямых ссылок <a href>)."""
    if not token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    user = db.execute(
        select(User).where(User.session_token == token)
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Сессия истекла")
    return user


def _get_resume_or_404(db: Session, resume_id: int, user: User) -> Resume:
    resume = db.get(Resume, resume_id)
    if not resume or resume.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Резюме не найдено")
    return resume


@router.get("/{resume_id}/export/pdf")
def export_pdf(
    resume_id: int,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    user = _user_by_token(db, token)
    resume = _get_resume_or_404(db, resume_id, user)

    context = build_resume_context(db, resume, user)
    template_filename = resume.template.style_file if resume.template else "hse_classic.html"
    pdf_bytes = render_resume_pdf(template_filename, context)

    filename = _safe_filename(resume.title, "pdf")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": _content_disposition(filename)},
    )


@router.get("/{resume_id}/export/docx")
def export_docx(
    resume_id: int,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    user = _user_by_token(db, token)
    resume = _get_resume_or_404(db, resume_id, user)

    context = build_resume_context(db, resume, user)
    docx_bytes = render_resume_docx(context)

    filename = _safe_filename(resume.title, "docx")
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": _content_disposition(filename)},
    )
