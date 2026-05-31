
from typing import Sequence, Union

import hashlib
import secrets

from alembic import op
import sqlalchemy as sa


revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ADMIN_EMAIL = "admin@resumehelper.local"
ADMIN_DEFAULT_PASSWORD = "Admin#2026!Reset"


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()


def upgrade() -> None:
    bind = op.get_bind()

    op.add_column(
        "user",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    existing = bind.execute(
        sa.text("SELECT user_id FROM \"user\" WHERE email = :email"),
        {"email": ADMIN_EMAIL},
    ).first()

    if existing is None:
        salt = secrets.token_hex(16)
        password_hash = _hash_password(ADMIN_DEFAULT_PASSWORD, salt)
        session_token = secrets.token_hex(32)
        bind.execute(
            sa.text(
                "INSERT INTO \"user\" "
                "(email, password_hash, password_salt, session_token, "
                "full_name, phone, is_admin) "
                "VALUES (:email, :password_hash, :password_salt, :session_token, "
                ":full_name, :phone, :is_admin)"
            ),
            {
                "email": ADMIN_EMAIL,
                "password_hash": password_hash,
                "password_salt": salt,
                "session_token": session_token,
                "full_name": "Администратор",
                "phone": "",
                "is_admin": True,
            },
        )


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text("DELETE FROM \"user\" WHERE email = :email"),
        {"email": ADMIN_EMAIL},
    )
    op.drop_column("user", "is_admin")
