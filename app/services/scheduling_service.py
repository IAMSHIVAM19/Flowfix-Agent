import hashlib

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import AppointmentOption, RequestExtraction
from ..models_db import (
    Appointment,
    Service,
    Technician,
    TechnicianAvailability,
    technician_services,
)


TIME_SLOT_MAP = {
    "morning": ("09:00", "12:00"),
    "afternoon": ("13:00", "17:00"),
}


def normalize_time_slot(
    preferred_time: str,
) -> tuple[str, str] | None:
    normalized = preferred_time.strip().lower()

    return TIME_SLOT_MAP.get(normalized)


def build_option_id(
    technician_id: int,
    appointment_date: str,
    start_time: str,
    end_time: str,
) -> str:
    raw = (
        f"{technician_id}|"
        f"{appointment_date}|"
        f"{start_time}|"
        f"{end_time}"
    )

    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def find_available_technicians_for_request(
    db: Session,
    service_name: str,
    appointment_date: str,
    start_time: str,
    end_time: str,
) -> list[Technician]:
    qualified_statement = (
        select(Technician)
        .join(
            technician_services,
            Technician.id == technician_services.c.technician_id,
        )
        .join(
            Service,
            Service.id == technician_services.c.service_id,
        )
        .where(
            Service.name == service_name.strip().lower(),
        )
    )

    qualified_technicians = list(
        db.scalars(qualified_statement).all()
    )

    available_technicians = []

    for technician in qualified_technicians:
        availability = db.scalar(
            select(TechnicianAvailability).where(
                TechnicianAvailability.technician_id == technician.id,
                TechnicianAvailability.available_date == appointment_date,
                TechnicianAvailability.start_time <= start_time,
                TechnicianAvailability.end_time >= end_time,
            )
        )

        if availability is None:
            continue

        overlapping_appointment = db.scalar(
            select(Appointment).where(
                Appointment.technician_id == technician.id,
                Appointment.appointment_date == appointment_date,
                Appointment.start_time < end_time,
                Appointment.end_time > start_time,
            )
        )

        if overlapping_appointment is None:
            available_technicians.append(technician)

    return available_technicians


def build_appointment_options(
    technicians,
    appointment_date: str,
    start_time: str,
    end_time: str,
) -> list[AppointmentOption]:
    return [
        AppointmentOption(
            option_id=build_option_id(
                technician_id=technician.id,
                appointment_date=appointment_date,
                start_time=start_time,
                end_time=end_time,
            ),
            technician_id=technician.id,
            technician_name=technician.name,
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
        )
        for technician in technicians
    ]


def get_appointment_options_for_request(
    db: Session,
    service_name: str,
    appointment_date: str,
    preferred_time: str,
) -> list[AppointmentOption]:
    time_slot = normalize_time_slot(preferred_time)

    if time_slot is None:
        return []

    start_time, end_time = time_slot

    technicians = find_available_technicians_for_request(
        db=db,
        service_name=service_name,
        appointment_date=appointment_date,
        start_time=start_time,
        end_time=end_time,
    )

    return build_appointment_options(
        technicians=technicians,
        appointment_date=appointment_date,
        start_time=start_time,
        end_time=end_time,
    )


def get_options_for_extraction(
    db: Session,
    extraction: RequestExtraction,
) -> list[AppointmentOption]:
    if (
        extraction.service is None
        or extraction.preferred_date is None
        or extraction.preferred_time is None
    ):
        return []

    options = get_appointment_options_for_request(
        db=db,
        service_name=extraction.service,
        appointment_date=extraction.preferred_date,
        preferred_time=extraction.preferred_time,
    )

    # High-priority requests should present the earliest suitable
    # technician first. We keep all valid options available.
    if extraction.urgency == "high":
        options.sort(
            key=lambda option: (
                option.appointment_date,
                option.start_time,
                option.technician_id,
            )
        )

    return options