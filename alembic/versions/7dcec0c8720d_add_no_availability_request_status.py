"""add no availability request status

Revision ID: 7dcec0c8720d
Revises: 6b448af4dc71
Create Date: 2026-08-23 17:10:04.071071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7dcec0c8720d'
down_revision: Union[str, Sequence[str], None] = '6b448af4dc71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE requeststatus "
        "ADD VALUE IF NOT EXISTS 'no_availability'"
    )


def downgrade() -> None:
    # PostgreSQL does not directly support removing enum values.
    pass