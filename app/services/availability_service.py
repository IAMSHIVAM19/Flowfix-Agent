from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models_db import (
    Service,
    Technician,
    TechnicianAvailability,
    technician_services,
)


def get_available_technicians(
    db: Session,
    service_name: str,
    available_date: str,
    start_time: str,
    end_time: str,
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
        .join(
            TechnicianAvailability,
            TechnicianAvailability.technician_id == Technician.id,
        )
        .where(
            Service.name == service_name.strip().lower(),
            TechnicianAvailability.available_date == available_date,
            TechnicianAvailability.start_time <= start_time,
            TechnicianAvailability.end_time >= end_time,
        )
    )

    return list(db.scalars(statement).all())
