# Клиент IO.Net
import asyncio
import logging
from dataclasses import dataclass

import httpx

from app.domain.services.ai_prompts import SYSTEM_PROMPT, build_user_prompt
from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AiResult:
    variants: list[str]
    used_mock: bool


_MOCK_VARIANTS = [
    (
        "Разработал(а) и внедрил(а) {what}, что позволило сократить время на типовую "
        "задачу на 30%. Использовал(а) современный стек технологий; отвечал(а) за "
        "проектирование архитектуры и взаимодействие с командой."
    ),
    (
        "В рамках проекта спроектировал(а) и реализовал(а) {what}. "
        "Презентовал(а) результат заказчику и получил(а) положительные отзывы за "
        "качество работы и документацию."
    ),
]


def _generate_mock(text: str) -> AiResult:
    snippet = text.strip()[:80] or "проект"
    variants = [tpl.format(what=snippet) for tpl in _MOCK_VARIANTS]
    return AiResult(variants=variants, used_mock=True)


async def _call_io_net(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {settings.IO_NET_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.IO_NET_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 600,
    }
    url = f"{settings.IO_NET_BASE_URL.rstrip('/')}/chat/completions"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=body)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


def _parse_variants(raw: str) -> list[str]:
    parts = [p.strip() for p in raw.split("---") if p.strip()]
    if not parts:
        return [raw.strip()]
    return parts[:3]


def improve_text(
    field_type: str,
    text: str,
    target_position: str | None = None,
) -> AiResult:
    if settings.AI_MOCK_MODE or not settings.IO_NET_API_KEY:
        if not settings.AI_MOCK_MODE:
            logger.warning("IO_NET_API_KEY не задан")
        return _generate_mock(text)

    prompt = build_user_prompt(field_type, text, target_position)
    try:
        raw = asyncio.run(_call_io_net(prompt))
        return AiResult(variants=_parse_variants(raw), used_mock=False)
    except Exception as e:
        logger.error("Ошибка вызова IO.Net: %s — fallback на mock", e)
        return _generate_mock(text)
