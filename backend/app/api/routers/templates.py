# Шаблоны резюме

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import Template
from app.domain.schemas.resume import TemplateOut

router = APIRouter(
    prefix="/api/templates",
    tags=["templates"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[TemplateOut])
def list_templates(db: Session = Depends(get_db)):
    return db.execute(select(Template).order_by(Template.template_name)).scalars().all()
