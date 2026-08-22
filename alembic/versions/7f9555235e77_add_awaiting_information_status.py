"""add awaiting information status

Revision ID: 7f9555235e77
Revises: fe96b0d353e8
Create Date: 2026-08-22 17:45:39.364154

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f9555235e77'
down_revision: Union[str, Sequence[str], None] = 'fe96b0d353e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE requeststatus "
        "ADD VALUE IF NOT EXISTS 'awaiting_information'"
    )


def downgrade() -> None:
    # PostgreSQL does not support removing an enum value directly.
    # Leave the downgrade empty for this development migration.
    pass