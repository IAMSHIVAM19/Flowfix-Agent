"""add request extraction fields

Revision ID: fe96b0d353e8
Revises: 97bca3b3e202
Create Date: 2026-08-22 17:26:54.687989

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe96b0d353e8'
down_revision: Union[str, Sequence[str], None] = '97bca3b3e202'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    request_urgency = sa.Enum(
        "low",
        "normal",
        "high",
        name="requesturgency",
    )

    request_urgency.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "service_requests",
        sa.Column("issue", sa.String(length=255), nullable=True),
    )

    op.add_column(
        "service_requests",
        sa.Column("service", sa.String(length=100), nullable=True),
    )

    op.add_column(
        "service_requests",
        sa.Column(
            "urgency",
            request_urgency,
            nullable=True,
        ),
    )

    op.add_column(
        "service_requests",
        sa.Column("preferred_date", sa.String(length=10), nullable=True),
    )

    op.add_column(
        "service_requests",
        sa.Column("preferred_time", sa.String(length=50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("service_requests", "preferred_time")
    op.drop_column("service_requests", "preferred_date")
    op.drop_column("service_requests", "urgency")
    op.drop_column("service_requests", "service")
    op.drop_column("service_requests", "issue")

    request_urgency = sa.Enum(
        "low",
        "normal",
        "high",
        name="requesturgency",
    )

    request_urgency.drop(op.get_bind(), checkfirst=True)