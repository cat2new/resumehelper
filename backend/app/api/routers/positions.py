# Должности

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models import Position, ProfessionalField, User
from app.domain.schemas.resume import PositionCreate, PositionOut, PositionUpdate

router = APIRouter(prefix="/api/positions", tags=["positions"])


@router.get("", response_model=list[PositionOut])
def list_positions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.execute(
        select(Position)
        .where(Position.user_id == user.user_id)
        .order_by(Position.position_name)
    ).scalars().all()
    return rows


@router.post("", response_model=PositionOut, status_code=status.HTTP_201_CREATED)
def create_position(
    payload: PositionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.get(ProfessionalField, payload.field_id):
        raise HTTPException(status_code=400, detail="Сфера не найдена")

    pos = Position(
        user_id=user.user_id,
        position_name=payload.position_name,
        field_id=payload.field_id,
        company=payload.company,
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return pos


@router.patch("/{position_id}", response_model=PositionOut)
def update_position(
    position_id: int,
    payload: PositionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pos = db.get(Position, position_id)
    if not pos or pos.user_id != user.user_id:
        raise HTTPException(status_code=404, detail="Должность не найдена")

    if payload.position_name is not None:
        pos.position_name = payload.position_name
    if payload.field_id is not None:
        if not db.get(ProfessionalField, payload.field_id):
            raise HTTPException(status_code=400, detail="Сфера не найдена")
        pos.field_id = payload.field_id
    if "company" in payload.model_fields_set:
        pos.company = payload.company

    db.commit()
    db.refresh(pos)
    return pos
