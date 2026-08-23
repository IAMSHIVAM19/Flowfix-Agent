from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models_db import Service, Technician, technician_services


def get_technicians_for_service(
    db: Session,
    service_name: str,
) -> list[Technician]:
    statement = (
        select(Technician)
        .join(
            technician_services,
            Technician.id == technician_services.c.technician_id,
        )
        .join(
            Service,
            Service.id == technician_services.c.service_id,
        )
        .where(Service.name == service_name.strip().lower())
    )

    return list(db.scalars(statement).all())