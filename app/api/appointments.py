from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import (
    AdminAppointmentStatusUpdateRequest,
    AppointmentResponse,
)
from ..models_db import (
    Appointment,
    Customer,
    Notification,
    ServiceRequest,
    Technician,
)
from ..services.pricing_service import calculate_quote_estimate


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


def _format_appointment(appointment, service_request, technician, customer):
    return {
        "id": appointment.id,
        "service_request_id": service_request.id,
        "request_id": service_request.request_id,
        "customer": (
            {
                "id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "address": customer.address,
            }
            if customer is not None
            else None
        ),
        "technician": {
            "id": technician.id,
            "name": technician.name,
        },
        "service": service_request.service,
        "issue": service_request.issue,
        "appointment_date": appointment.appointment_date,
        "start_time": appointment.start_time,
        "end_time": appointment.end_time,
        "status": appointment.status,
        "quote_estimate": calculate_quote_estimate(
            service_request.service,
            service_request.urgency.value if service_request.urgency else None,
        ),
        "technician_notes": appointment.technician_notes,
        "declined_reason": appointment.declined_reason,
    }


@router.get(
    "",
    response_model=list[AppointmentResponse],
    dependencies=[Depends(require_operations)],
)
def list_appointments(
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Appointment,
            ServiceRequest,
            Technician,
            Customer,
        )
        .join(
            ServiceRequest,
            ServiceRequest.id
            == Appointment.service_request_id,
        )
        .join(
            Technician,
            Technician.id
            == Appointment.technician_id,
        )
        .outerjoin(
            Customer,
            Customer.id
            == ServiceRequest.customer_id,
        )
        .order_by(
            Appointment.appointment_date,
            Appointment.start_time,
        )
    )

    rows = db.execute(statement).all()

    return [
        _format_appointment(
            appointment,
            service_request,
            technician,
            customer,
        )
        for (
            appointment,
            service_request,
            technician,
            customer,
        ) in rows
    ]


@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentResponse,
    dependencies=[Depends(require_operations)],
)
def update_appointment_status(
    appointment_id: int,
    payload: AdminAppointmentStatusUpdateRequest,
    db: Session = Depends(get_db),
):
    statement = (
        select(
            Appointment,
            ServiceRequest,
            Technician,
            Customer,
        )
        .join(
            ServiceRequest,
            ServiceRequest.id == Appointment.service_request_id,
        )
        .join(
            Technician,
            Technician.id == Appointment.technician_id,
        )
        .outerjoin(
            Customer,
            Customer.id == ServiceRequest.customer_id,
        )
        .where(Appointment.id == appointment_id)
    )

    row = db.execute(statement).first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment #{appointment_id} not found.",
        )

    appointment, service_request, technician, customer = row

    appointment.status = payload.status
    if payload.notes is not None:
        appointment.technician_notes = payload.notes.strip()
    if payload.reason is not None:
        appointment.declined_reason = payload.reason.strip()

    if payload.status == "completed":
        notification = Notification(
            service_request_id=service_request.id,
            recipient_type="admin",
            notification_type="appointment_completed",
            message=(
                f"✅ Appointment #{appointment.id} (Specialist: {technician.name}) marked COMPLETED. "
                f"Technician workload capacity has been released."
            ),
            status="simulated",
        )
        db.add(notification)
    elif payload.status == "cancelled":
        notification = Notification(
            service_request_id=service_request.id,
            recipient_type="admin",
            notification_type="appointment_cancelled",
            message=(
                f"⚠️ Appointment #{appointment.id} (Specialist: {technician.name}) was CANCELLED. "
                f"Technician shift slot released."
            ),
            status="simulated",
        )
        db.add(notification)

    db.commit()
    db.refresh(appointment)

    return _format_appointment(
        appointment,
        service_request,
        technician,
        customer,
    )