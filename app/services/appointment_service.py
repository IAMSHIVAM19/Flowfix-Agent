from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models_db import (
    Appointment,
    Service,
    TechnicianAvailability,
    technician_services,
)
from .service_validation import normalize_service_name


def is_technician_qualified(
    db: Session,
    technician_id: int,
    service_name: str,
) -> bool:
    normalized_name = normalize_service_name(service_name)

    if normalized_name is None:
        return False

    statement = (
        select(technician_services.c.technician_id)
        .join(
            Service,
            Service.id == technician_services.c.service_id,
        )
        .where(
            technician_services.c.technician_id == technician_id,
            Service.name == normalized_name,
        )
    )

    return db.scalar(statement) is not None


def is_within_availability(
    db: Session,
    technician_id: int,
    appointment_date: str,
    start_time: str,
    end_time: str,
) -> bool:
    statement = select(TechnicianAvailability).where(
        TechnicianAvailability.technician_id == technician_id,
        TechnicianAvailability.available_date == appointment_date,
        TechnicianAvailability.start_time <= start_time,
        TechnicianAvailability.end_time >= end_time,
    )

    return db.scalar(statement) is not None


def has_overlapping_appointment(
    db: Session,
    technician_id: int,
    appointment_date: str,
    start_time: str,
    end_time: str,
) -> bool:
    statement = select(Appointment).where(
        Appointment.technician_id == technician_id,
        Appointment.appointment_date == appointment_date,
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    )

    return db.scalar(statement) is not None


def create_appointment(
    db: Session,
    service_request_id: int,
    technician_id: int,
    service_name: str,
    appointment_date: str,
    start_time: str,
    end_time: str,
    status: str = "confirmed",
) -> Appointment:
    if not is_technician_qualified(
        db=db,
        technician_id=technician_id,
        service_name=service_name,
    ):
        raise ValueError(
            "Technician is not qualified for the requested service."
        )

    if not is_within_availability(
        db=db,
        technician_id=technician_id,
        appointment_date=appointment_date,
        start_time=start_time,
        end_time=end_time,
    ):
        raise ValueError(
            "Technician is not available for the requested appointment time."
        )

    if has_overlapping_appointment(
        db=db,
        technician_id=technician_id,
        appointment_date=appointment_date,
        start_time=start_time,
        end_time=end_time,
    ):
        raise ValueError(
            "Technician already has an overlapping appointment."
        )

    appointment = Appointment(
        service_request_id=service_request_id,
        technician_id=technician_id,
        appointment_date=appointment_date,
        start_time=start_time,
        end_time=end_time,
        status=status,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment