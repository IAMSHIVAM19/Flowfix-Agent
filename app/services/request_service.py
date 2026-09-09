import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import RequestExtraction
from ..models_db import Customer, ServiceRequest


def get_customer_by_phone(
    db: Session,
    phone: str,
):
    statement = select(Customer).where(
        Customer.phone == phone
    )

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


def merge_extraction_with_existing_request(
    service_request: ServiceRequest,
    extraction: RequestExtraction,
) -> RequestExtraction:
    """
    Preserve previously validated request information when a
    follow-up extraction omits fields that were already known.

    A missing value from the new extraction means the customer did
    not provide new information for that field; it does not erase
    the previously validated value.
    """

    if extraction.service is None:
        extraction.service = service_request.service

    if extraction.urgency is None:
        extraction.urgency = service_request.urgency

    if extraction.preferred_date is None:
        extraction.preferred_date = (
            service_request.preferred_date
        )

    if extraction.preferred_time is None:
        extraction.preferred_time = (
            service_request.preferred_time
        )

    if service_request.issue:
        extraction.issue = service_request.issue

    return extraction


def update_service_request_from_extraction(
    service_request: ServiceRequest,
    extraction: RequestExtraction,
):
    if extraction.issue:
        service_request.issue = extraction.issue
    if extraction.service:
        service_request.service = extraction.service
    if extraction.urgency:
        service_request.urgency = extraction.urgency
    if extraction.preferred_date:
        service_request.preferred_date = extraction.preferred_date
    if extraction.preferred_time:
        service_request.preferred_time = extraction.preferred_time

    return service_request