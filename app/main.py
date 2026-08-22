import uuid
from datetime import date

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from .database import get_db
from .models import CustomerRequest, RequestResponse, RequestStatus
from .services.extraction_service import process_extraction
from .services.llm_provider import get_extraction
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
            "status": RequestStatus.AWAITING_CUSTOMER_CONFIRMATION,
            "message": (
                f"We couldn't find a customer with this phone number. "
                f"Please confirm that your name is {request.name} "
                f"and your address is {request.address}."
            ),
        }

    extraction = get_extraction(
        message=request.message,
        current_date=date.today(),
    )

    extraction_result = process_extraction(
        extraction=extraction,
        db=db,
    )

    if extraction_result.status == "needs_clarification":
        return {
            "request_id": str(uuid.uuid4()),
            "status": RequestStatus.AWAITING_INFORMATION,
            "message": extraction_result.message,
        }

    service_request = create_service_request(
        db=db,
        message=request.message,
        customer_id=customer.id,
        status=RequestStatus.RECEIVED,
        extraction=extraction,
    )

    return {
        "request_id": service_request.request_id,
        "status": service_request.status,
        "message": f"Customer found: {customer.name}",
    }