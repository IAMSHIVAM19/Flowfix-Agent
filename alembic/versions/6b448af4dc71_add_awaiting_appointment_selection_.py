"""add awaiting appointment selection status

Revision ID: 6b448af4dc71
Revises: cddc6d5977ca
Create Date: 2026-08-23 16:16:39.854331

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b448af4dc71'
down_revision: Union[str, Sequence[str], None] = 'cddc6d5977ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE requeststatus "
        "ADD VALUE IF NOT EXISTS 'awaiting_appointment_selection'"
    )


def downgrade() -> None:
    # PostgreSQL does not support directly removing an enum value.
    pass