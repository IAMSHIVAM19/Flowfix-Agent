"""add technician portal fields and appointment notes

Revision ID: e81f9a2d3c4b
Revises: a5ba10e33c9c
Create Date: 2026-09-11 00:30:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e81f9a2d3c4b"
down_revision: Union[str, Sequence[str], None] = "a5ba10e33c9c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # Using IF NOT EXISTS via raw sql execution to ensure idempotence
    conn.execute(sa.text("ALTER TABLE technicians ADD COLUMN IF NOT EXISTS phone VARCHAR(30)"))
    conn.execute(sa.text("ALTER TABLE technicians ADD COLUMN IF NOT EXISTS pin_code VARCHAR(50) DEFAULT '1234'"))
    conn.execute(sa.text("ALTER TABLE technicians ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'active'"))
    conn.execute(sa.text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS technician_notes TEXT"))
    conn.execute(sa.text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS declined_reason TEXT"))


def downgrade() -> None:
    op.drop_column("appointments", "declined_reason")
    op.drop_column("appointments", "technician_notes")
    op.drop_column("technicians", "status")
    op.drop_column("technicians", "pin_code")
    op.drop_column("technicians", "phone")
