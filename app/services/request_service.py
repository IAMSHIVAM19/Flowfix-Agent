from sqlalchemy import select

from ..models_db import Customer
import uuid

from ..models_db import Customer, ServiceRequest


def get_customer_by_phone(db, phone: str):
    statement = select(Customer).where(Customer.phone == phone)
    return db.scalar(statement)


def create_customer(db, name: str, phone: str, address: str):
    customer = Customer(
        name=name,
        phone=phone,
        address=address,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer

def create_service_request(db, message: str, customer_id: int | None, status: str):
    service_request = ServiceRequest(
        request_id=str(uuid.uuid4()),
        customer_id=customer_id,
        message=message,
        status=status,
    )

    db.add(service_request)
    db.commit()
    db.refresh(service_request)

    return service_request