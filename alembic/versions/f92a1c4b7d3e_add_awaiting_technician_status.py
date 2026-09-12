"""add awaiting_technician request status

Revision ID: f92a1c4b7d3e
Revises: e81f9a2d3c4b
Create Date: 2026-09-11 11:15:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f92a1c4b7d3e"
down_revision: Union[str, Sequence[str], None] = "e81f9a2d3c4b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TYPE requeststatus ADD VALUE IF NOT EXISTS 'awaiting_technician'"))


def downgrade() -> None:
    pass
