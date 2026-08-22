import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import RequestExtraction
from ..models_db import Customer, ServiceRequest


def get_customer_by_phone(db: Session, phone: str):
    statement = select(Customer).where(Customer.phone == phone)
    return db.scalar(statement)


def create_customer(
    db: Session,
    name: str,
    phone: str,
    address: str,
):
    customer = Customer(
        name=name,
        phone=phone,
        address=address,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


def create_service_request(
    db: Session,
    message: str,
    customer_id: int | None,
    status,
    extraction: RequestExtraction,
):
    service_request = ServiceRequest(
        request_id=str(uuid.uuid4()),
        customer_id=customer_id,
        message=message,
        issue=extraction.issue,
        service=extraction.service,
        urgency=extraction.urgency,
        preferred_date=extraction.preferred_date,
        preferred_time=extraction.preferred_time,
        status=status,
    )

    db.add(service_request)
    db.commit()
    db.refresh(service_request)

    return service_request