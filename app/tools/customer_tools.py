from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..models_db import Customer
from ..services.request_service import (
    get_customer_by_phone,
)


def get_customer(
    db: Session,
    phone: str | None = None,
    name: str | None = None,
) -> dict | None:
    """
    Retrieve a customer by phone number or name.

    Returns a small, agent-friendly representation
    rather than exposing the SQLAlchemy model directly.
    """
    if phone:
        customer = get_customer_by_phone(
            db=db,
            phone=phone.strip(),
        )
        if customer is not None:
            return {
                "customer_id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "address": customer.address,
            }

    if name:
        stmt = (
            select(Customer)
            .where(Customer.name.ilike(f"%{name.strip()}%"))
            .order_by(Customer.id)
        )
        customer = db.scalar(stmt)
        if customer is not None:
            return {
                "customer_id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "address": customer.address,
            }

    return None


def search_customers(
    db: Session,
    query: str = "",
) -> list[dict]:
    """
    Search for existing FlowFix customers by name, phone, or address.
    """
    q = (query or "").strip()
    if not q:
        stmt = select(Customer).order_by(Customer.id).limit(10)
    else:
        stmt = (
            select(Customer)
            .where(
                or_(
                    Customer.name.ilike(f"%{q}%"),
                    Customer.phone.ilike(f"%{q}%"),
                    Customer.address.ilike(f"%{q}%"),
                )
            )
            .order_by(Customer.id)
            .limit(10)
        )

    customers = db.scalars(stmt).all()
    return [
        {
            "customer_id": c.id,
            "name": c.name,
            "phone": c.phone,
            "address": c.address,
        }
        for c in customers
    ]