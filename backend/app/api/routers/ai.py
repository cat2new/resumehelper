# ИИ-помощь

from fastapi import APIRouter, Depends

from app.infrastructure.ai_client import improve_text
from app.api.dependencies import get_current_user
from app.domain.schemas.ai import AiImproveRequest, AiImproveResponse

router = APIRouter(
    prefix="/api/ai",
    tags=["ai"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/improve", response_model=AiImproveResponse)
def improve(payload: AiImproveRequest) -> AiImproveResponse:
    result = improve_text(
        field_type=payload.field_type,
        text=payload.text,
        target_position=payload.target_position,
    )
    return AiImproveResponse(variants=result.variants, used_mock=result.used_mock)
