import uuid

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import CustomerRequest, RequestResponse
from .services.request_service import (
    create_service_request,
    get_customer_by_phone,
)

app = FastAPI()


@app.get("/")
def home():
    return {"message": "FlowFix API is running"}


@app.post("/requests", response_model=RequestResponse)
def create_request(
    request: CustomerRequest,
    db: Session = Depends(get_db),
):
    customer = get_customer_by_phone(db, request.phone)

    if not customer:
        return {
            "request_id": str(uuid.uuid4()),
            "status": "awaiting_customer_confirmation",
            "message": (
                f"We couldn't find a customer with this phone number. "
                f"Please confirm that your name is {request.name} "
                f"and your address is {request.address}."
            ),
        }

    service_request = create_service_request(
        db=db,
        message=request.message,
        customer_id=customer.id,
        status="received",
    )

    customer_name = customer.name

    return {
        "request_id": service_request.request_id,
        "status": service_request.status,
        "message": f"Customer found: {customer_name}",
    }