# Генерация PDF через WeasyPrint

from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "resume"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_resume_html(template_filename: str, context: dict[str, Any]) -> str:
    name = Path(template_filename).name
    template = _jinja_env.get_template(name)
    return template.render(**context)


def render_resume_pdf(template_filename: str, context: dict[str, Any]) -> bytes:
    html_str = render_resume_html(template_filename, context)
    return HTML(string=html_str).write_pdf()
