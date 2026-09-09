from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models_db import ServiceRequestMessage


def get_request_messages(
    db: Session,
    service_request_id: int,
) -> list[dict]:
    statement = (
        select(ServiceRequestMessage)
        .where(
            ServiceRequestMessage.service_request_id
            == service_request_id
        )
        .order_by(ServiceRequestMessage.id.asc())
    )

    messages = list(
        db.scalars(statement).all()
    )

    return [
        {
            "role": message.role,
            "content": message.message,
        }
        for message in messages
    ]
