"""add notifications table

Revision ID: a5ba10e33c9c
Revises: 2571066c5534
Create Date: 2026-08-31 23:20:30.437713

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a5ba10e33c9c"
down_revision: Union[str, Sequence[str], None] = "2571066c5534"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create notifications table."""
    op.create_table(
        "notifications",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "service_request_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "recipient_type",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "notification_type",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "message",
            sa.String(length=2000),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["service_request_id"],
            ["service_requests.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Drop notifications table."""
    op.drop_table("notifications")