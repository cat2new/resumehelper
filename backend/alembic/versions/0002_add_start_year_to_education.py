
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("education", sa.Column("start_year", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("education", "start_year")
