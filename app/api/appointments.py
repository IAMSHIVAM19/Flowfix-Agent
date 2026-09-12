from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import AppointmentResponse
from ..models_db import (
    Appointment,
    Customer,
    ServiceRequest,
    Technician,
)


from ..services.pricing_service import calculate_quote_estimate


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


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
        {
            "id": appointment.id,
            "service_request_id": service_request.id,
            "request_id": (
                service_request.request_id
            ),
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
            "appointment_date": (
                appointment.appointment_date
            ),
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
        for (
            appointment,
            service_request,
            technician,
            customer,
        ) in rows
    ]