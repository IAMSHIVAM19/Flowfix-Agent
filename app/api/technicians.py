from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import (
    TechnicianAvailabilityResponse,
    TechnicianResponse,
)
from ..models_db import (
    Appointment,
    Service,
    Technician,
    TechnicianAvailability,
    technician_services,
)


router = APIRouter(
    prefix="/technicians",
    tags=["Technicians"],
)


# ============================================================
# TECHNICIAN LIST
# ============================================================

@router.get(
    "",
    response_model=list[TechnicianResponse],
    dependencies=[Depends(require_operations)],
)
def list_technicians(
    db: Session = Depends(get_db),
):
    technician_statement = (
        select(Technician)
        .order_by(Technician.id)
    )

    technicians = list(
        db.scalars(
            technician_statement
        ).all()
    )

    if not technicians:
        return []

    technician_ids = [
        technician.id
        for technician in technicians
    ]

    # Fetch all technician services.
    service_statement = (
        select(
            technician_services.c.technician_id,
            Service.name,
        )
        .join(
            Service,
            Service.id
            == technician_services.c.service_id,
        )
        .where(
            technician_services.c.technician_id.in_(
                technician_ids
            )
        )
        .order_by(
            technician_services.c.technician_id,
            Service.name,
        )
    )

    service_rows = db.execute(
        service_statement
    ).all()

    services_by_technician = {
        technician_id: []
        for technician_id in technician_ids
    }

    for (
        technician_id,
        service_name,
    ) in service_rows:
        services_by_technician[
            technician_id
        ].append(service_name)

    # Fetch all appointments.
    appointment_statement = (
        select(Appointment)
        .where(
            Appointment.technician_id.in_(
                technician_ids
            )
        )
        .order_by(
            Appointment.technician_id,
            Appointment.appointment_date,
            Appointment.start_time,
        )
    )

    appointment_rows = list(
        db.scalars(
            appointment_statement
        ).all()
    )

    appointments_by_technician = {
        technician_id: []
        for technician_id in technician_ids
    }

    for appointment in appointment_rows:
        appointments_by_technician[
            appointment.technician_id
        ].append(
            {
                "id": appointment.id,
                "service_request_id": (
                    appointment.service_request_id
                ),
                "appointment_date": (
                    appointment.appointment_date
                ),
                "start_time": appointment.start_time,
                "end_time": appointment.end_time,
                "status": appointment.status,
            }
        )

    return [
        {
            "id": technician.id,
            "name": technician.name,
            "services": services_by_technician[
                technician.id
            ],
            "appointments": (
                appointments_by_technician[
                    technician.id
                ]
            ),
        }
        for technician in technicians
    ]


# ============================================================
# TECHNICIAN AVAILABILITY
# ============================================================

@router.get(
    "/{technician_id}/availability",
    response_model=TechnicianAvailabilityResponse,
    dependencies=[Depends(require_operations)],
)
def technician_availability(
    technician_id: int,
    db: Session = Depends(get_db),
):
    technician = db.scalar(
        select(Technician).where(
            Technician.id == technician_id
        )
    )

    if technician is None:
        raise HTTPException(
            status_code=404,
            detail="Technician not found.",
        )

    statement = (
        select(TechnicianAvailability)
        .where(
            TechnicianAvailability.technician_id
            == technician_id
        )
        .order_by(
            TechnicianAvailability.available_date,
            TechnicianAvailability.start_time,
        )
    )

    availability = list(
        db.scalars(statement).all()
    )

    return {
        "technician_id": technician.id,
        "technician_name": technician.name,
        "availability": [
            {
                "id": slot.id,
                "available_date": (
                    slot.available_date
                ),
                "start_time": slot.start_time,
                "end_time": slot.end_time,
            }
            for slot in availability
        ],
    }