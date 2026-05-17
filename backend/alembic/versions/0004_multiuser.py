
from typing import Sequence, Union

import hashlib
import secrets

from alembic import op
import sqlalchemy as sa


revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()


def upgrade() -> None:
    bind = op.get_bind()

    op.create_table(
        "user",
        sa.Column("user_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(100), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(64), nullable=False),
        sa.Column("password_salt", sa.String(32), nullable=False),
        sa.Column("session_token", sa.String(64), nullable=True, unique=True),
        sa.Column("full_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("phone", sa.String(30), nullable=False, server_default=""),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("photo_storage_key", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    has_resumes = bind.execute(sa.text("SELECT COUNT(*) FROM resume")).scalar() or 0
    profile_row = bind.execute(
        sa.text(
            "SELECT full_name, phone, email, photo_url, photo_storage_key "
            "FROM user_profile WHERE profile_id = 1"
        )
    ).fetchone()

    legacy_user_id: int | None = None
    if has_resumes > 0 or (profile_row and (profile_row[0] or profile_row[2])):
        legacy_email = (profile_row[2] if profile_row else "") or "legacy@resumehelper.local"
        legacy_full_name = (profile_row[0] if profile_row else "") or ""
        legacy_phone = (profile_row[1] if profile_row else "") or ""
        legacy_photo_url = profile_row[3] if profile_row else None
        legacy_photo_key = profile_row[4] if profile_row else None

        salt = secrets.token_hex(16)
        password_hash = _hash_password("Sveta123", salt)

        result = bind.execute(
            sa.text(
                "INSERT INTO \"user\" (email, password_hash, password_salt, "
                "full_name, phone, photo_url, photo_storage_key) "
                "VALUES (:email, :ph, :ps, :fn, :phone, :pu, :pk) "
                "RETURNING user_id"
            ),
            {
                "email": legacy_email,
                "ph": password_hash,
                "ps": salt,
                "fn": legacy_full_name,
                "phone": legacy_phone,
                "pu": legacy_photo_url,
                "pk": legacy_photo_key,
            },
        )
        legacy_user_id = result.scalar_one()

    op.add_column(
        "resume",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.user_id", ondelete="CASCADE"), nullable=True),
    )
    if legacy_user_id is not None:
        bind.execute(sa.text("UPDATE resume SET user_id = :uid"), {"uid": legacy_user_id})
    op.alter_column("resume", "user_id", nullable=False)
    op.create_index("ix_resume_user_id", "resume", ["user_id"])

    op.add_column(
        "portfolio_item",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.user_id", ondelete="CASCADE"), nullable=True),
    )
    if legacy_user_id is not None:
        bind.execute(
            sa.text("UPDATE portfolio_item SET user_id = :uid"),
            {"uid": legacy_user_id},
        )
    op.alter_column("portfolio_item", "user_id", nullable=False)
    op.create_index("ix_portfolio_item_user_id", "portfolio_item", ["user_id"])

    op.add_column(
        "position",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.user_id", ondelete="CASCADE"), nullable=True),
    )
    if legacy_user_id is not None:
        bind.execute(sa.text("UPDATE position SET user_id = :uid"), {"uid": legacy_user_id})
    op.alter_column("position", "user_id", nullable=False)
    op.create_index("ix_position_user_id", "position", ["user_id"])

    op.add_column(
        "skill",
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("user.user_id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_index("ix_skill_user_id", "skill", ["user_id"])
    op.drop_table("user_profile")


def downgrade() -> None:
    op.create_table(
        "user_profile",
        sa.Column("profile_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("phone", sa.String(30), nullable=False, server_default=""),
        sa.Column("email", sa.String(100), nullable=False, server_default=""),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("photo_storage_key", sa.String(500), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.execute(
        "INSERT INTO user_profile (profile_id, full_name, phone, email) VALUES (1, '', '', '')"
    )

    op.drop_index("ix_skill_user_id", table_name="skill")
    op.drop_column("skill", "user_id")

    op.drop_index("ix_position_user_id", table_name="position")
    op.drop_column("position", "user_id")

    op.drop_index("ix_portfolio_item_user_id", table_name="portfolio_item")
    op.drop_column("portfolio_item", "user_id")

    op.drop_index("ix_resume_user_id", table_name="resume")
    op.drop_column("resume", "user_id")

    op.drop_table("user")
