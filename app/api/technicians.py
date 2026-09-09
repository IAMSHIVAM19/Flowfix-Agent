from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import (
    TechnicianAvailabilityResponse,
    TechnicianCreateRequest,
    TechnicianResponse,
    TechnicianServiceResponse,
)
from ..models_db import (
    Appointment,
    Service,
    Technician,
    TechnicianAvailability,
    technician_services,
)

router = APIRouter(prefix="/technicians", tags=["Technicians"])


@router.get(
    "/services",
    response_model=list[TechnicianServiceResponse],
    dependencies=[Depends(require_operations)],
)
def list_services(db: Session = Depends(get_db)):
    statement = select(Service).order_by(Service.name)
    services = list(db.scalars(statement).all())

    return [
        {
            "id": service.id,
            "name": service.name,
        }
        for service in services
    ]


@router.post(
    "",
    response_model=TechnicianResponse,
    dependencies=[Depends(require_operations)],
)
def create_technician(
    payload: TechnicianCreateRequest,
    db: Session = Depends(get_db),
):
    name = payload.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Technician name cannot be empty.",
        )

    service_ids = list(dict.fromkeys(payload.service_ids))

    if not service_ids:
        raise HTTPException(
            status_code=400,
            detail="At least one service must be selected.",
        )

    services = list(
        db.scalars(
            select(Service).where(Service.id.in_(service_ids))
        ).all()
    )

    found_service_ids = {service.id for service in services}

    missing_service_ids = [
        service_id
        for service_id in service_ids
        if service_id not in found_service_ids
    ]

    if missing_service_ids:
        raise HTTPException(
            status_code=400,
            detail=(
                "One or more selected services do not exist: "
                f"{missing_service_ids}"
            ),
        )

    technician = Technician(name=name)

    db.add(technician)
    db.flush()

    db.execute(
        technician_services.insert(),
        [
            {
                "technician_id": technician.id,
                "service_id": service_id,
            }
            for service_id in service_ids
        ],
    )

    # Automatically initialize rolling 35 days of morning and afternoon shifts
    today = date.today()
    slots = []
    for day_offset in range(35):
        slot_date = (today + timedelta(days=day_offset)).isoformat()
        slots.append(
            TechnicianAvailability(
                technician_id=technician.id,
                available_date=slot_date,
                start_time="09:00",
                end_time="12:00",
            )
        )
        slots.append(
            TechnicianAvailability(
                technician_id=technician.id,
                available_date=slot_date,
                start_time="13:00",
                end_time="17:00",
            )
        )
    db.add_all(slots)

    db.commit()
    db.refresh(technician)

    sorted_services = sorted(
        services,
        key=lambda service: service.name.lower(),
    )

    return {
        "id": technician.id,
        "name": technician.name,
        "services": [
            service.name
            for service in sorted_services
        ],
        "appointments": [],
    }


@router.get(
    "",
    response_model=list[TechnicianResponse],
    dependencies=[Depends(require_operations)],
)
def list_technicians(db: Session = Depends(get_db)):
    technician_statement = (
        select(Technician)
        .order_by(Technician.id)
    )

    technicians = list(
        db.scalars(technician_statement).all()
    )

    if not technicians:
        return []

    technician_ids = [
        technician.id
        for technician in technicians
    ]

    service_statement = (
        select(
            technician_services.c.technician_id,
            Service.name,
        )
        .join(
            Service,
            Service.id == technician_services.c.service_id,
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

    for technician_id, service_name in service_rows:
        services_by_technician[
            technician_id
        ].append(service_name)

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
                "service_request_id": appointment.service_request_id,
                "appointment_date": appointment.appointment_date,
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
            "appointments": appointments_by_technician[
                technician.id
            ],
        }
        for technician in technicians
    ]


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
                "available_date": slot.available_date,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
            }
            for slot in availability
        ],
    }