# Схемы ИИ-помощи

from pydantic import BaseModel, Field


class AiImproveRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    field_type: str = Field(default="experience_description")
    target_position: str | None = Field(default=None, max_length=200)


class AiImproveResponse(BaseModel):
    variants: list[str]
    used_mock: bool = False
