# Заполнение справочников

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database import SessionLocal
from app.domain.models import (
    Discipline,
    EducationalProgram,
    ExperienceType,
    FileFormat,
    Language,
    ProfessionalField,
    ResumeStatus,
    Skill,
    SkillCategory,
    Template,
)

RESUME_STATUSES = ["Черновик", "Готово"]

PROFESSIONAL_FIELDS = [
    "IT и разработка",
    "Аналитика данных",
    "Маркетинг и реклама",
    "Финансы и аудит",
    "Консалтинг",
    "HR и подбор персонала",
    "Менеджмент проектов",
    "Дизайн и UX/UI",
    "Образование и наука",
    "Юриспруденция",
]

SKILL_CATEGORIES = [
    "Программирование",
    "Базы данных",
    "Аналитика",
    "Soft Skills",
    "Дизайн",
    "Менеджмент",
    "Маркетинг",
]

EXPERIENCE_TYPES = ["Учебный проект", "Внеучебный проект", "Стажировка", "Работа", "Олимпиада/Конкурс"]

DISCIPLINES = [
    "Анализ данных",
    "Веб-разработка",
    "Машинное обучение",
    "Менеджмент проектов",
    "Маркетинг",
    "HR и управление персоналом",
    "Финансовый анализ",
    "Бизнес-аналитика",
    "Программная инженерия",
    "Базы данных",
]

FILE_FORMATS = [".pdf", ".docx", ".pptx", ".xlsx", ".jpg", ".png", ".zip", ".mp4", ".accdb", ".txt"]

EDUCATIONAL_PROGRAMS = [
    ("BPI", "Бизнес-информатика", "ФКН", "Бакалавриат"),
    ("BPM", "Программная инженерия", "ФКН", "Бакалавриат"),
    ("BEC", "Экономика", "ФЭН", "Бакалавриат"),
    ("BMG", "Менеджмент", "ФМ", "Бакалавриат"),
    ("BIB", "Международный бакалавриат по бизнесу", "ФМ", "Бакалавриат"),
    ("BPS", "Психология", "ФСН", "Бакалавриат"),
    ("BPR", "Юриспруденция", "ФП", "Бакалавриат"),
    ("BDS", "Дизайн", "ФД", "Бакалавриат"),
]

LANGUAGES = [
    "Английский",
    "Немецкий",
    "Французский",
    "Испанский",
    "Итальянский",
    "Китайский",
    "Японский",
    "Корейский",
    "Русский",
]

INITIAL_SKILLS = [
    # Программирование — языки
    ("Python", "Программирование"),
    ("JavaScript", "Программирование"),
    ("TypeScript", "Программирование"),
    ("Java", "Программирование"),
    ("Kotlin", "Программирование"),
    ("Swift", "Программирование"),
    ("C#", "Программирование"),
    ("C++", "Программирование"),
    ("C", "Программирование"),
    ("Go", "Программирование"),
    ("Rust", "Программирование"),
    ("PHP", "Программирование"),
    ("Ruby", "Программирование"),
    ("Scala", "Программирование"),
    ("Dart", "Программирование"),
    ("R", "Программирование"),
    ("MATLAB", "Программирование"),
    ("HTML/CSS", "Программирование"),
    ("Sass / SCSS", "Программирование"),
    # Программирование — фреймворки и библиотеки
    ("React", "Программирование"),
    ("Vue.js", "Программирование"),
    ("Angular", "Программирование"),
    ("Next.js", "Программирование"),
    ("Svelte", "Программирование"),
    ("Node.js", "Программирование"),
    ("Express.js", "Программирование"),
    ("NestJS", "Программирование"),
    ("Django", "Программирование"),
    ("Flask", "Программирование"),
    ("FastAPI", "Программирование"),
    ("Spring Boot", "Программирование"),
    ("ASP.NET", "Программирование"),
    ("Ruby on Rails", "Программирование"),
    ("Flutter", "Программирование"),
    ("React Native", "Программирование"),
    ("Electron", "Программирование"),
    # Программирование — DevOps/Cloud
    ("Git", "Программирование"),
    ("GitHub Actions", "Программирование"),
    ("Docker", "Программирование"),
    ("Kubernetes", "Программирование"),
    ("Linux", "Программирование"),
    ("Bash / Shell", "Программирование"),
    ("CI/CD", "Программирование"),
    ("AWS", "Программирование"),
    ("Google Cloud", "Программирование"),
    ("Azure", "Программирование"),
    ("Yandex Cloud", "Программирование"),
    ("Nginx", "Программирование"),
    # БД
    ("PostgreSQL", "Базы данных"),
    ("MySQL", "Базы данных"),
    ("MongoDB", "Базы данных"),
    ("SQLite", "Базы данных"),
    ("Redis", "Базы данных"),
    ("Oracle Database", "Базы данных"),
    ("MS SQL Server", "Базы данных"),
    ("MS Access", "Базы данных"),
    ("Elasticsearch", "Базы данных"),
    ("ClickHouse", "Базы данных"),
    ("SQL", "Базы данных"),
    ("NoSQL", "Базы данных"),
    # Аналитика
    ("Excel", "Аналитика"),
    ("Google Sheets", "Аналитика"),
    ("Power BI", "Аналитика"),
    ("Tableau", "Аналитика"),
    ("Pandas", "Аналитика"),
    ("NumPy", "Аналитика"),
    ("scikit-learn", "Аналитика"),
    ("TensorFlow", "Аналитика"),
    ("PyTorch", "Аналитика"),
    ("Jupyter Notebook", "Аналитика"),
    ("Apache Spark", "Аналитика"),
    ("Airflow", "Аналитика"),
    ("Статистический анализ", "Аналитика"),
    ("Машинное обучение", "Аналитика"),
    ("A/B тестирование", "Аналитика"),
    # Soft Skills
    ("Командная работа", "Soft Skills"),
    ("Лидерство", "Soft Skills"),
    ("Коммуникация", "Soft Skills"),
    ("Управление временем", "Soft Skills"),
    ("Презентационные навыки", "Soft Skills"),
    ("Критическое мышление", "Soft Skills"),
    ("Решение проблем", "Soft Skills"),
    ("Эмпатия", "Soft Skills"),
    ("Креативность", "Soft Skills"),
    ("Стрессоустойчивость", "Soft Skills"),
    # Дизайн
    ("Figma", "Дизайн"),
    ("Adobe Photoshop", "Дизайн"),
    ("Adobe Illustrator", "Дизайн"),
    ("Adobe XD", "Дизайн"),
    ("Adobe InDesign", "Дизайн"),
    ("Adobe After Effects", "Дизайн"),
    ("Adobe Premiere Pro", "Дизайн"),
    ("Sketch", "Дизайн"),
    ("Canva", "Дизайн"),
    ("CorelDRAW", "Дизайн"),
    ("Blender", "Дизайн"),
    ("UI-дизайн", "Дизайн"),
    ("UX-исследования", "Дизайн"),
    ("Прототипирование", "Дизайн"),
    # Менеджмент
    ("Agile / Scrum", "Менеджмент"),
    ("Kanban", "Менеджмент"),
    ("Waterfall", "Менеджмент"),
    ("Jira", "Менеджмент"),
    ("Confluence", "Менеджмент"),
    ("Trello", "Менеджмент"),
    ("Notion", "Менеджмент"),
    ("MS Project", "Менеджмент"),
    ("Управление командой", "Менеджмент"),
    ("Бюджетирование", "Менеджмент"),
    ("Риск-менеджмент", "Менеджмент"),
    # Маркетинг
    ("SMM", "Маркетинг"),
    ("SEO", "Маркетинг"),
    ("Контекстная реклама", "Маркетинг"),
    ("Таргетированная реклама", "Маркетинг"),
    ("Google Analytics", "Маркетинг"),
    ("Яндекс.Метрика", "Маркетинг"),
    ("Контент-маркетинг", "Маркетинг"),
    ("Email-маркетинг", "Маркетинг"),
    ("Копирайтинг", "Маркетинг"),
    ("Бренд-менеджмент", "Маркетинг"),
]

TEMPLATES = [
    (
        "Классический НИУ ВШЭ",
        "Строгий одностраничный шаблон в корпоративных цветах ВШЭ.",
        "templates/resume/hse_classic.html",
    ),
]


def _seed_simple(db: Session, model, key_field: str, values: list[str]) -> None:
    existing = {getattr(row, key_field) for row in db.execute(select(model)).scalars()}
    for value in values:
        if value not in existing:
            db.add(model(**{key_field: value}))
    db.commit()


def _seed_programs(db: Session) -> None:
    existing = {p.program_code for p in db.execute(select(EducationalProgram)).scalars()}
    for code, name, faculty, level in EDUCATIONAL_PROGRAMS:
        if code not in existing:
            db.add(EducationalProgram(program_code=code, program_name=name, faculty=faculty, degree_level=level))
    db.commit()


def _seed_skills(db: Session) -> None:
    cat_map = {c.category_name: c.category_id for c in db.execute(select(SkillCategory)).scalars()}
    existing = {s.skill_name for s in db.execute(select(Skill)).scalars()}
    for name, cat_name in INITIAL_SKILLS:
        if name in existing:
            continue
        cat_id = cat_map.get(cat_name)
        if cat_id:
            db.add(Skill(skill_name=name, category_id=cat_id))
    db.commit()


def _seed_templates(db: Session) -> None:
    existing = {t.template_name for t in db.execute(select(Template)).scalars()}
    for name, desc, path in TEMPLATES:
        if name not in existing:
            db.add(Template(template_name=name, description=desc, style_file=path))
    db.commit()


def seed_all() -> None:
    db = SessionLocal()
    try:
        print("→ Заполняю справочники...")
        _seed_simple(db, ProfessionalField, "field_name", PROFESSIONAL_FIELDS)
        _seed_simple(db, ResumeStatus, "status_name", RESUME_STATUSES)
        _seed_simple(db, SkillCategory, "category_name", SKILL_CATEGORIES)
        _seed_simple(db, ExperienceType, "type_name", EXPERIENCE_TYPES)
        _seed_simple(db, Discipline, "discipline_name", DISCIPLINES)
        _seed_simple(db, FileFormat, "extension", FILE_FORMATS)
        _seed_simple(db, Language, "language_name", LANGUAGES)
        _seed_programs(db)
        _seed_skills(db)
        _seed_templates(db)
        print("✓ Сидинг завершён.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
