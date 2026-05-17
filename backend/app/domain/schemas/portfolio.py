# Схемы портфолио

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PortfolioItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    portfolio_item_id: int
    file_name: str
    storage_url: str
    experience_id: int | None
    format_id: int
    file_size: int
    created_at: datetime


class PortfolioItemAttach(BaseModel):
    experience_id: int | None
