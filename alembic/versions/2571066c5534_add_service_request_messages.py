"""add service request messages

Revision ID: 2571066c5534
Revises: d04563e2b9eb
Create Date: 2026-08-26 15:43:05.592038

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2571066c5534"
down_revision: Union[str, Sequence[str], None] = "d04563e2b9eb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "service_request_messages",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "service_request_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "role",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "message",
            sa.String(length=2000),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["service_request_id"],
            ["service_requests.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("service_request_messages")