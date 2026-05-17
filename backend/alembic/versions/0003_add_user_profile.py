
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_profile",
        sa.Column("profile_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("phone", sa.String(30), nullable=False, server_default=""),
        sa.Column("email", sa.String(100), nullable=False, server_default=""),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("photo_storage_key", sa.String(500), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.execute(
        "INSERT INTO user_profile (profile_id, full_name, phone, email) VALUES (1, '', '', '')"
    )


def downgrade() -> None:
    op.drop_table("user_profile")
