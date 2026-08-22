"""add request status enum

Revision ID: c919fdbd8c75
Revises: 
Create Date: 2026-08-20 14:37:54.748895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c919fdbd8c75'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    request_status = sa.Enum(
        "received",
        "awaiting_customer_confirmation",
        name="requeststatus",
    )

    request_status.create(op.get_bind(), checkfirst=True)

    op.alter_column(
        "service_requests",
        "status",
        existing_type=sa.VARCHAR(length=50),
        type_=request_status,
        existing_nullable=False,
        postgresql_using="status::requeststatus",
    )


def downgrade() -> None:
    request_status = sa.Enum(
        "received",
        "awaiting_customer_confirmation",
        name="requeststatus",
    )

    op.alter_column(
        "service_requests",
        "status",
        existing_type=request_status,
        type_=sa.VARCHAR(length=50),
        existing_nullable=False,
        postgresql_using="status::text",
    )

    request_status.drop(op.get_bind(), checkfirst=True)