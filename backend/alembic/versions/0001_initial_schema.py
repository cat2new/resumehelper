
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Справочники
    op.create_table(
        "professional_field",
        sa.Column("field_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("field_name", sa.String(100), nullable=False),
    )
    op.create_table(
        "resume_status",
        sa.Column("status_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("status_name", sa.String(20), nullable=False, server_default="Черновик"),
    )
    op.create_table(
        "skill_category",
        sa.Column("category_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("category_name", sa.String(50), nullable=False),
    )
    op.create_table(
        "experience_type",
        sa.Column("type_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("type_name", sa.String(50), nullable=False),
    )
    op.create_table(
        "discipline",
        sa.Column("discipline_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("discipline_name", sa.String(100), nullable=False),
    )
    op.create_table(
        "file_format",
        sa.Column("format_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("extension", sa.String(10), nullable=False),
    )
    op.create_table(
        "educational_program",
        sa.Column("program_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("program_code", sa.String(20), unique=True, nullable=False),
        sa.Column("program_name", sa.String(200), nullable=False),
        sa.Column("faculty", sa.String(100), nullable=False),
        sa.Column("degree_level", sa.String(50), nullable=False, server_default="Бакалавриат"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "language",
        sa.Column("language_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("language_name", sa.String(50), nullable=False),
    )

    # Основные сущности
    op.create_table(
        "position",
        sa.Column("position_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("position_name", sa.String(100), nullable=False),
        sa.Column(
            "field_id",
            sa.Integer(),
            sa.ForeignKey("professional_field.field_id"),
            nullable=False,
        ),
        sa.Column("company", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "template",
        sa.Column("template_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("template_name", sa.String(50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("style_file", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "skill",
        sa.Column("skill_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("skill_name", sa.String(50), nullable=False),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("skill_category.category_id"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "resume",
        sa.Column("resume_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("owner_full_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("owner_email", sa.String(100), nullable=False, server_default=""),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("creation_date", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("position_id", sa.Integer(), sa.ForeignKey("position.position_id"), nullable=False),
        sa.Column("template_id", sa.Integer(), sa.ForeignKey("template.template_id"), nullable=False),
        sa.Column("status_id", sa.Integer(), sa.ForeignKey("resume_status.status_id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "education",
        sa.Column("education_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("institution", sa.String(100), nullable=False, server_default="НИУ ВШЭ"),
        sa.Column(
            "program_id",
            sa.Integer(),
            sa.ForeignKey("educational_program.program_id"),
            nullable=False,
        ),
        sa.Column("graduation_year", sa.Integer(), nullable=False),
        sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resume.resume_id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "experience",
        sa.Column("experience_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("project_name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resume.resume_id"), nullable=False),
        sa.Column(
            "type_id", sa.Integer(), sa.ForeignKey("experience_type.type_id"), nullable=False
        ),
        sa.Column(
            "discipline_id",
            sa.Integer(),
            sa.ForeignKey("discipline.discipline_id"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "portfolio_item",
        sa.Column("portfolio_item_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("storage_url", sa.String(500), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False, server_default=""),
        sa.Column(
            "experience_id",
            sa.Integer(),
            sa.ForeignKey("experience.experience_id"),
            nullable=True,
        ),
        sa.Column(
            "format_id", sa.Integer(), sa.ForeignKey("file_format.format_id"), nullable=False
        ),
        sa.Column("file_size", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "resume_skill",
        sa.Column(
            "resume_id",
            sa.Integer(),
            sa.ForeignKey("resume.resume_id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "skill_id", sa.Integer(), sa.ForeignKey("skill.skill_id"), primary_key=True
        ),
        sa.Column("skill_level", sa.String(20), nullable=False, server_default="Средний"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "resume_language",
        sa.Column(
            "resume_id",
            sa.Integer(),
            sa.ForeignKey("resume.resume_id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "language_id", sa.Integer(), sa.ForeignKey("language.language_id"), primary_key=True
        ),
        sa.Column("proficiency", sa.String(10), nullable=False, server_default="B2"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("resume_language")
    op.drop_table("resume_skill")
    op.drop_table("portfolio_item")
    op.drop_table("experience")
    op.drop_table("education")
    op.drop_table("resume")
    op.drop_table("skill")
    op.drop_table("template")
    op.drop_table("position")
    op.drop_table("language")
    op.drop_table("educational_program")
    op.drop_table("file_format")
    op.drop_table("discipline")
    op.drop_table("experience_type")
    op.drop_table("skill_category")
    op.drop_table("resume_status")
    op.drop_table("professional_field")
