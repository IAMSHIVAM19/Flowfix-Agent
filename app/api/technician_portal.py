"""
Technician Portal API for FlowFix AI.
Handles technician authentication, bookings management, status transitions (accept, decline, en_route, complete),
and shift schedules.
"""

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth.security import create_access_token, decode_access_token
from ..database import get_db
from ..models import (
    QuoteEstimate,
    RequestStatus,
    TechnicianBookingItem,
    TechnicianBookingsResponse,
    TechnicianLoginRequest,
    TechnicianLoginResponse,
    TechnicianProfileResponse,
    TechnicianStatusUpdateRequest,
)
from ..models_db import (
    Appointment,
    Customer,
    Notification,
    Service,
    ServiceRequest,
    Technician,
    TechnicianAvailability,
    technician_services,
)
from ..services.pricing_service import calculate_quote_estimate

router = APIRouter(
    prefix="/technician-api",
    tags=["Technician Portal"],
)

oauth2_tech_scheme = OAuth2PasswordBearer(
    tokenUrl="/technician-api/login",
    auto_error=False,
)


def get_current_technician(
    token: str | None = Depends(oauth2_tech_scheme),
    db: Session = Depends(get_db),
) -> Technician:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Technician authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        sub = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired technician token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tech_id = None
    if sub.startswith("tech:"):
        try:
            tech_id = int(sub.split(":", 1)[1])
        except ValueError:
            pass
    elif sub.isdigit():
        tech_id = int(sub)

    if tech_id is None:
        # Check if subject is a technician name directly
        tech = db.scalar(
            select(Technician).where(Technician.name.ilike(sub))
        )
        if tech:
            return tech
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Technician account not found.",
        )

    technician = db.scalar(
        select(Technician).where(Technician.id == tech_id)
    )

    if technician is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Technician account not found.",
        )

    return technician


def _get_technician_services(db: Session, technician_id: int) -> list[str]:
    statement = (
        select(Service.name)
        .join(
            technician_services,
            technician_services.c.service_id == Service.id,
        )
        .where(technician_services.c.technician_id == technician_id)
        .order_by(Service.name)
    )
    return list(db.scalars(statement).all())


# ============================================================
# PUBLIC TECHNICIAN DIRECTORY (For quick switcher / demo login)
# ============================================================

@router.get("/list")
def list_active_technicians(db: Session = Depends(get_db)):
    technicians = list(
        db.scalars(
            select(Technician).order_by(Technician.id)
        ).all()
    )

    results = []
    for t in technicians:
        services = _get_technician_services(db, t.id)
        results.append({
            "id": t.id,
            "name": t.name,
            "phone": t.phone or "0400 000 000",
            "services": services,
            "status": getattr(t, "status", "active") or "active",
        })
    return results


# ============================================================
# TECHNICIAN LOGIN
# ============================================================

@router.post("/login", response_model=TechnicianLoginResponse)
def technician_login(
    payload: TechnicianLoginRequest,
    db: Session = Depends(get_db),
):
    query_str = payload.username_or_id.strip()

    technician = None
    if query_str.isdigit():
        technician = db.scalar(
            select(Technician).where(Technician.id == int(query_str))
        )

    if technician is None:
        technician = db.scalar(
            select(Technician).where(Technician.name.ilike(query_str))
        )

    if technician is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"No technician found with identifier '{query_str}'.",
        )

    # PIN check: accept default "1234" if not set or matches
    expected_pin = getattr(technician, "pin_code", "1234") or "1234"
    if payload.pin.strip() != expected_pin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid technician PIN. (Default test PIN is 1234)",
        )

    token = create_access_token(
        subject=f"tech:{technician.id}",
        expires_minutes=60 * 24,  # 24 hours for field technician session
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "technician_id": technician.id,
        "technician_name": technician.name,
    }


# ============================================================
# TECHNICIAN PROFILE / ME
# ============================================================

@router.get("/me", response_model=TechnicianProfileResponse)
def get_technician_profile(
    current_tech: Technician = Depends(get_current_technician),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    services = _get_technician_services(db, current_tech.id)

    today_count = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.technician_id == current_tech.id,
            Appointment.appointment_date == today_str,
            Appointment.status != "cancelled",
        )
    ) or 0

    upcoming_count = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.technician_id == current_tech.id,
            Appointment.appointment_date > today_str,
            Appointment.status != "cancelled",
        )
    ) or 0

    completed_count = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.technician_id == current_tech.id,
            Appointment.status == "completed",
        )
    ) or 0

    return {
        "id": current_tech.id,
        "name": current_tech.name,
        "phone": getattr(current_tech, "phone", None) or "0412 345 678",
        "services": services,
        "status": getattr(current_tech, "status", "active") or "active",
        "today_jobs_count": today_count,
        "upcoming_jobs_count": upcoming_count,
        "completed_jobs_count": completed_count,
    }


# ============================================================
# BOOKINGS & SCHEDULE
# ============================================================

def _build_booking_item(
    appointment: Appointment,
    service_request: ServiceRequest,
    customer: Customer | None,
) -> dict[str, Any]:
    urgency_val = (
        service_request.urgency.value
        if hasattr(service_request.urgency, "value")
        else str(service_request.urgency or "normal")
    )
    estimate = calculate_quote_estimate(service_request.service, urgency_val)

    return {
        "id": appointment.id,
        "service_request_id": service_request.id,
        "request_id": service_request.request_id,
        "customer_name": customer.name if customer else "Customer",
        "customer_phone": customer.phone if customer else "N/A",
        "customer_address": customer.address if customer else "N/A",
        "service": service_request.service,
        "issue": service_request.issue or service_request.message,
        "urgency": urgency_val,
        "appointment_date": appointment.appointment_date,
        "start_time": appointment.start_time,
        "end_time": appointment.end_time,
        "status": appointment.status,
        "quote_estimate": estimate,
        "technician_notes": getattr(appointment, "technician_notes", None),
        "declined_reason": getattr(appointment, "declined_reason", None),
    }


@router.get("/bookings", response_model=TechnicianBookingsResponse)
def get_technician_bookings(
    current_tech: Technician = Depends(get_current_technician),
    db: Session = Depends(get_db),
):
    statement = (
        select(Appointment, ServiceRequest, Customer)
        .join(
            ServiceRequest,
            ServiceRequest.id == Appointment.service_request_id,
        )
        .outerjoin(
            Customer,
            Customer.id == ServiceRequest.customer_id,
        )
        .where(Appointment.technician_id == current_tech.id)
        .order_by(Appointment.appointment_date, Appointment.start_time)
    )

    rows = db.execute(statement).all()
    today_str = date.today().isoformat()

    all_items = [
        _build_booking_item(app, req, cust)
        for app, req, cust in rows
    ]

    today_items = [
        item for item in all_items
        if item["appointment_date"] == today_str and item["status"] != "cancelled"
    ]

    upcoming_items = [
        item for item in all_items
        if item["appointment_date"] > today_str and item["status"] not in {"completed", "cancelled"}
    ]

    completed_items = [
        item for item in all_items
        if item["status"] == "completed"
    ]

    # "Up next": first non-completed, non-declined, non-cancelled appointment
    active_candidates = [
        item for item in all_items
        if item["status"] in {"confirmed", "accepted", "en_route", "in_progress"}
        and item["appointment_date"] >= today_str
    ]
    up_next = active_candidates[0] if active_candidates else None

    return {
        "up_next": up_next,
        "today": today_items,
        "upcoming": upcoming_items,
        "completed": completed_items,
    }


@router.patch("/bookings/{appointment_id}/status", response_model=TechnicianBookingItem)
def update_booking_status(
    appointment_id: int,
    payload: TechnicianStatusUpdateRequest,
    current_tech: Technician = Depends(get_current_technician),
    db: Session = Depends(get_db),
):
    statement = (
        select(Appointment, ServiceRequest, Customer)
        .join(
            ServiceRequest,
            ServiceRequest.id == Appointment.service_request_id,
        )
        .outerjoin(
            Customer,
            Customer.id == ServiceRequest.customer_id,
        )
        .where(
            Appointment.id == appointment_id,
            Appointment.technician_id == current_tech.id,
        )
    )

    result = db.execute(statement).first()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found or not assigned to you.",
        )

    appointment, service_request, customer = result

    new_status = payload.status
    appointment.status = new_status

    if new_status == "declined":
        reason = (payload.reason or "").strip() or "Declined by technician"
        appointment.declined_reason = reason
        service_request.status = RequestStatus.AWAITING_TECHNICIAN

        # Log high priority notification for dispatcher
        notification = Notification(
            service_request_id=service_request.id,
            recipient_type="admin",
            notification_type="technician_declined_booking",
            message=(
                f"🚨 Technician {current_tech.name} DECLINED Booking #{appointment.id} "
                f"({appointment.appointment_date} {appointment.start_time}–{appointment.end_time}) "
                f"for {customer.name if customer else 'Customer'}. Reason: {reason}"
            ),
            status="simulated",
        )
        db.add(notification)

    elif new_status == "completed":
        if payload.notes:
            appointment.technician_notes = payload.notes.strip()

    elif new_status == "accepted":
        service_request.status = RequestStatus.CONFIRMED

        # Notification for record
        notification = Notification(
            service_request_id=service_request.id,
            recipient_type="admin",
            notification_type="technician_accepted_booking",
            message=(
                f"✅ Technician {current_tech.name} ACCEPTED Booking #{appointment.id} "
                f"({appointment.appointment_date} {appointment.start_time}–{appointment.end_time})."
            ),
            status="simulated",
        )
        db.add(notification)

    db.commit()
    db.refresh(appointment)

    return _build_booking_item(appointment, service_request, customer)


@router.get("/schedule")
def get_technician_schedule(
    current_tech: Technician = Depends(get_current_technician),
    db: Session = Depends(get_db),
):
    today_str = date.today().isoformat()
    statement = (
        select(TechnicianAvailability)
        .where(
            TechnicianAvailability.technician_id == current_tech.id,
            TechnicianAvailability.available_date >= today_str,
        )
        .order_by(
            TechnicianAvailability.available_date,
            TechnicianAvailability.start_time,
        )
        .limit(20)
    )

    slots = list(db.scalars(statement).all())
    return [
        {
            "id": slot.id,
            "date": slot.available_date,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "slot_name": "Morning (09:00–12:00)" if slot.start_time == "09:00" else "Afternoon (13:00–17:00)",
        }
        for slot in slots
    ]
