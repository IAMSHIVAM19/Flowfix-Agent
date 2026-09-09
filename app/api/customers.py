from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import (
    CustomerDetail,
    CustomerSummary,
)
from ..models_db import (
    Appointment,
    Customer,
    ServiceRequest,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


# ============================================================
# CUSTOMER LIST
# ============================================================

@router.get(
    "",
    response_model=list[CustomerSummary],
    dependencies=[Depends(require_operations)],
)
def list_customers(
    db: Session = Depends(get_db),
):
    request_count = (
        select(
            ServiceRequest.customer_id,
            func.count(
                ServiceRequest.id
            ).label("request_count"),
        )
        .group_by(
            ServiceRequest.customer_id
        )
        .subquery()
    )

    appointment_count = (
        select(
            ServiceRequest.customer_id,
            func.count(
                Appointment.id
            ).label("appointment_count"),
        )
        .join(
            Appointment,
            Appointment.service_request_id
            == ServiceRequest.id,
        )
        .group_by(
            ServiceRequest.customer_id
        )
        .subquery()
    )

    statement = (
        select(
            Customer,
            func.coalesce(
                request_count.c.request_count,
                0,
            ).label("request_count"),
            func.coalesce(
                appointment_count.c.appointment_count,
                0,
            ).label("appointment_count"),
        )
        .outerjoin(
            request_count,
            request_count.c.customer_id
            == Customer.id,
        )
        .outerjoin(
            appointment_count,
            appointment_count.c.customer_id
            == Customer.id,
        )
        .order_by(Customer.name)
    )

    rows = db.execute(statement).all()

    return [
        {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "address": customer.address,
            "request_count": request_count,
            "appointment_count": appointment_count,
            "requests_count": request_count,
            "appointments_count": appointment_count,
        }
        for (
            customer,
            request_count,
            appointment_count,
        ) in rows
    ]


# ============================================================
# CUSTOMER DETAIL
# ============================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerDetail,
    dependencies=[Depends(require_operations)],
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = db.scalar(
        select(Customer).where(
            Customer.id == customer_id
        )
    )

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    request_statement = (
        select(ServiceRequest)
        .where(
            ServiceRequest.customer_id
            == customer.id
        )
        .order_by(
            ServiceRequest.id.desc()
        )
    )

    service_requests = list(
        db.scalars(
            request_statement
        ).all()
    )

    appointment_statement = (
        select(Appointment)
        .join(
            ServiceRequest,
            ServiceRequest.id
            == Appointment.service_request_id,
        )
        .where(
            ServiceRequest.customer_id
            == customer.id
        )
        .order_by(
            Appointment.appointment_date,
            Appointment.start_time,
        )
    )

    appointments = list(
        db.scalars(
            appointment_statement
        ).all()
    )

    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "address": customer.address,
        "requests": [
            {
                "id": service_request.id,
                "request_id": (
                    service_request.request_id
                ),
                "issue": service_request.issue,
                "service": service_request.service,
                "urgency": service_request.urgency,
                "preferred_date": (
                    service_request.preferred_date
                ),
                "preferred_time": (
                    service_request.preferred_time
                ),
                "status": service_request.status,
            }
            for service_request
            in service_requests
        ],
        "appointments": [
            {
                "id": appointment.id,
                "service_request_id": (
                    appointment.service_request_id
                ),
                "technician_id": (
                    appointment.technician_id
                ),
                "appointment_date": (
                    appointment.appointment_date
                ),
                "start_time": appointment.start_time,
                "end_time": appointment.end_time,
                "status": appointment.status,
            }
            for appointment in appointments
        ],
    }