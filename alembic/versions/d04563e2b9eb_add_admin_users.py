"""add admin users

Revision ID: d04563e2b9eb
Revises: bc929965ff41
Create Date: 2026-08-24 16:21:44.643630
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d04563e2b9eb"
down_revision: Union[str, Sequence[str], None] = (
    "bc929965ff41"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_users",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "username",
            sa.String(length=100),
            nullable=False,
            unique=True,
            index=True,
        ),
        sa.Column(
            "password_hash",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "role",
            sa.String(length=50),
            nullable=False,
            server_default="admin",
        ),
    )


def downgrade() -> None:
    op.drop_table("admin_users")