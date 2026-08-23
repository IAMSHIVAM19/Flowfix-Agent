"""add confirmed request status

Revision ID: cddc6d5977ca
Revises: fee453b8793c
Create Date: 2026-08-23 15:39:59.418933

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "cddc6d5977ca"
down_revision: Union[str, Sequence[str], None] = "fee453b8793c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE requeststatus "
        "ADD VALUE IF NOT EXISTS 'confirmed'"
    )


def downgrade() -> None:
    # PostgreSQL does not directly support removing an enum value.
    pass