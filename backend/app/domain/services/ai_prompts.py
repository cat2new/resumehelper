# Шаблоны промтов для ИИ-помощи

SYSTEM_PROMPT = (
    "Ты — карьерный консультант, помогающий студентам НИУ ВШЭ составлять резюме "
    "для отбора на практику и стажировки. Твоя задача — улучшить формулировку, "
    "сделав её конкретной, профессиональной и измеримой. "
    "Сохраняй фактическое содержание исходного текста — не выдумывай новые факты. "
    "Отвечай ТОЛЬКО переработанными вариантами, без пояснений и приветствий."
)


PROMPT_TEMPLATES: dict[str, str] = {
    "experience_description": (
        "Перепиши описание учебного/рабочего опыта так, чтобы оно подчёркивало "
        "результат, использованные технологии и личный вклад. "
        "Сделай 2 разных варианта по 2–4 предложения каждый.\n\n"
        "{context_block}"
        "Исходный текст:\n«{text}»\n\n"
        "Формат ответа: два варианта, разделённые строкой '---'."
    ),
}


def build_user_prompt(
    field_type: str,
    text: str,
    target_position: str | None = None,
) -> str:
    template = PROMPT_TEMPLATES.get(field_type, PROMPT_TEMPLATES["experience_description"])
    context_lines = []
    if target_position:
        context_lines.append(f"Целевая должность: {target_position}")
    context_block = ("Контекст:\n" + "\n".join(context_lines) + "\n\n") if context_lines else ""
    return template.format(text=text, context_block=context_block)
