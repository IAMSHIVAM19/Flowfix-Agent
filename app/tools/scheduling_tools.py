from sqlalchemy.orm import Session

from ..models import (
    AppointmentOption,
    RequestExtraction,
    RequestUrgency,
)

from ..models_db import Notification
from ..services.confirmation_service import (
    confirm_appointment,
)
from ..services.scheduling_service import (
    get_options_for_extraction,
)
from ..services.service_validation import (
    normalize_service_name,
)


def check_availability(
    db: Session,
    service: str,
    appointment_date: str,
    preferred_time: str,
    urgency: str | None = None,
) -> list[dict]:
    """
    Find available appointment options for a service request.

    The tool delegates availability decisions to the existing
    deterministic scheduling service.
    """

    normalized_urgency = None

    if urgency is not None:
        normalized_urgency = urgency.strip().lower()

        if normalized_urgency not in {
            "low",
            "normal",
            "high",
        }:
            normalized_urgency = None

    extraction = RequestExtraction(
        issue=f"Service request for {service}",
        service=service,
        urgency=(
            RequestUrgency(normalized_urgency)
            if normalized_urgency is not None
            else None
        ),
        preferred_date=appointment_date,
        preferred_weekday=None,
        preferred_time=preferred_time,
        needs_follow_up=False,
        follow_up_question=None,
    )
    options = get_options_for_extraction(
        db=db,
        extraction=extraction,
    )

    return [
        option.model_dump()
        for option in options
    ]


def create_booking(
    db: Session,
    service_request_id: int,
    option: dict,
    service_name: str,
) -> dict:
    """
    Create a confirmed appointment from an appointment option.

    The tool delegates the actual booking and request-status
    update to the existing confirmation service.
    """

    appointment_option = AppointmentOption(
        **option
    )

    appointment = confirm_appointment(
        db=db,
        option=appointment_option,
        service_request_id=service_request_id,
        service_name=service_name,
    )

    return {
        "appointment_id": appointment.id,
        "service_request_id": service_request_id,
        "technician_id": appointment.technician_id,
        "appointment_date": appointment.appointment_date,
        "start_time": appointment.start_time,
        "end_time": appointment.end_time,
        "status": appointment.status,
    }


def send_confirmation(
    db: Session,
    service_request_id: int,
    customer_name: str,
    technician_name: str,
    appointment_date: str,
    start_time: str,
    end_time: str,
) -> dict:
    """
    Log a simulated appointment confirmation.

    No external email or SMS service is called.
    """

    message = (
        f"Hi {customer_name}, your FlowFix appointment "
        f"with {technician_name} is confirmed for "
        f"{appointment_date} from {start_time} to {end_time}."
    )

    notification = Notification(
        service_request_id=service_request_id,
        recipient_type="customer",
        notification_type="appointment_confirmation",
        message=message,
        status="simulated",
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "notification_id": notification.id,
        "service_request_id": service_request_id,
        "recipient_type": notification.recipient_type,
        "notification_type": notification.notification_type,
        "message": notification.message,
        "status": notification.status,
    }


def list_appointments(
    db: Session,
    status: str | None = "confirmed",
    technician_name: str | None = None,
    appointment_date: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """
    List existing appointments in the system with customer, service, and technician details.
    """
    from ..models_db import Appointment, Customer, ServiceRequest, Technician

    query = db.query(Appointment)
    if status and status.strip().lower() != "all":
        query = query.filter(Appointment.status.ilike(status.strip()))
    if appointment_date:
        query = query.filter(Appointment.appointment_date == appointment_date.strip())
    if technician_name:
        tech = db.query(Technician).filter(Technician.name.ilike(f"%{technician_name.strip()}%")).first()
        if tech:
            query = query.filter(Appointment.technician_id == tech.id)

    appointments = (
        query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc())
        .limit(limit)
        .all()
    )

    results = []
    for app in appointments:
        tech = db.query(Technician).filter(Technician.id == app.technician_id).first()
        req = db.query(ServiceRequest).filter(ServiceRequest.id == app.service_request_id).first()
        cust = (
            db.query(Customer).filter(Customer.id == req.customer_id).first()
            if req and req.customer_id
            else None
        )

        results.append({
            "appointment_id": app.id,
            "status": app.status,
            "appointment_date": app.appointment_date,
            "start_time": app.start_time,
            "end_time": app.end_time,
            "technician_name": tech.name if tech else f"Technician #{app.technician_id}",
            "service": req.service or req.issue or "Plumbing service" if req else "Plumbing service",
            "customer_name": cust.name if cust else "N/A",
            "customer_phone": cust.phone if cust else "N/A",
            "customer_address": cust.address if cust else "N/A",
        })

    return results


def list_technicians(
    db: Session,
    service_name: str | None = None,
) -> list[dict]:
    """
    Retrieve technicians and their certified plumbing skills/services.
    """
    from ..models_db import Service, Technician, technician_services

    techs = db.query(Technician).all()
    results = []

    norm_service = normalize_service_name(service_name) if service_name else None

    for t in techs:
        service_rows = (
            db.query(Service)
            .join(technician_services, Service.id == technician_services.c.service_id)
            .filter(technician_services.c.technician_id == t.id)
            .all()
        )
        services = [s.name for s in service_rows]

        if norm_service and norm_service not in services:
            continue

        results.append({
            "technician_id": t.id,
            "name": t.name,
            "certified_services": services,
        })

    return results


def list_service_requests(
    db: Session,
    urgency: str | None = None,
    status: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """
    List customer service requests with urgency, status, and customer info.
    """
    from ..models_db import Customer, ServiceRequest

    query = db.query(ServiceRequest)
    if urgency:
        query = query.filter(ServiceRequest.urgency == urgency.strip().lower())
    if status:
        query = query.filter(ServiceRequest.status == status.strip().lower())

    requests = (
        query.order_by(ServiceRequest.id.desc())
        .limit(limit)
        .all()
    )

    results = []
    for req in requests:
        cust = (
            db.query(Customer).filter(Customer.id == req.customer_id).first()
            if req.customer_id
            else None
        )
        results.append({
            "request_id": req.request_id,
            "service": req.service or "Not specified",
            "issue": req.issue or "Not specified",
            "urgency": getattr(req.urgency, "value", req.urgency),
            "status": getattr(req.status, "value", req.status),
            "preferred_date": req.preferred_date,
            "preferred_time": req.preferred_time,
            "customer_name": cust.name if cust else "Unconfirmed",
            "customer_phone": cust.phone if cust else "N/A",
        })

    return results