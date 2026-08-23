from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import AppointmentOption, RequestStatus
from ..models_db import Appointment, ServiceRequest
from .appointment_service import create_appointment


def confirm_appointment(
    db: Session,
    option: AppointmentOption,
    service_request_id: int,
    service_name: str,
) -> Appointment:
    try:
        appointment = create_appointment(
            db=db,
            service_request_id=service_request_id,
            technician_id=option.technician_id,
            service_name=service_name,
            appointment_date=option.appointment_date,
            start_time=option.start_time,
            end_time=option.end_time,
        )

        service_request = db.scalar(
            select(ServiceRequest).where(
                ServiceRequest.id == service_request_id
            )
        )

        if service_request is None:
            raise ValueError("Service request not found.")

        service_request.status = RequestStatus.CONFIRMED

        db.commit()
        db.refresh(appointment)

        return appointment

    except Exception:
        db.rollback()
        raise