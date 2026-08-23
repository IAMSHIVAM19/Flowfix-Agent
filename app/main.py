import uuid
from datetime import date

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import (
    AppointmentConfirmation,
    CustomerRequest,
    RequestExtraction,
    RequestResponse,
    RequestStatus,
)
from .models_db import ServiceRequest
from .services.confirmation_service import confirm_appointment
from .services.extraction_service import process_extraction
from .services.llm_provider import get_extraction
from .services.request_service import (
    create_service_request,
    get_customer_by_phone,
)
from .services.scheduling_service import get_options_for_extraction
from .services.scheduling_workflow import process_scheduling


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
            "appointment_options": [],
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
            "appointment_options": [],
        }

    scheduling_result = process_scheduling(
        db=db,
        extraction=extraction_result.extraction,
    )

    if scheduling_result.status == "no_availability":
        return {
            "request_id": str(uuid.uuid4()),
            "status": RequestStatus.RECEIVED,
            "message": scheduling_result.message,
            "appointment_options": [],
        }

    service_request = create_service_request(
        db=db,
        message=request.message,
        customer_id=customer.id,
        status=RequestStatus.AWAITING_APPOINTMENT_SELECTION,
        extraction=extraction_result.extraction,
    )

    return {
        "request_id": service_request.request_id,
        "status": service_request.status,
        "message": scheduling_result.message,
        "appointment_options": scheduling_result.appointment_options,
    }


@app.post(
    "/requests/{request_id}/confirm",
    response_model=RequestResponse,
)
def confirm_request(
    request_id: str,
    confirmation: AppointmentConfirmation,
    db: Session = Depends(get_db),
):
    service_request = db.scalar(
        select(ServiceRequest).where(
            ServiceRequest.request_id == request_id
        )
    )

    if service_request is None:
        raise HTTPException(
            status_code=404,
            detail="Service request not found.",
        )

    if service_request.status != RequestStatus.AWAITING_APPOINTMENT_SELECTION:
        raise HTTPException(
            status_code=400,
            detail="This service request cannot be confirmed.",
        )

    extraction = RequestExtraction(
        issue=service_request.issue or "",
        service=service_request.service,
        urgency=service_request.urgency,
        preferred_date=service_request.preferred_date,
        preferred_weekday=None,
        preferred_time=service_request.preferred_time,
    )

    options = get_options_for_extraction(
        db=db,
        extraction=extraction,
    )

    selected_option = next(
        (
            option
            for option in options
            if option.option_id == confirmation.option_id
        ),
        None,
    )

    if selected_option is None:
        raise HTTPException(
            status_code=400,
            detail="The selected appointment option is no longer available.",
        )

    confirm_appointment(
        db=db,
        option=selected_option,
        service_request_id=service_request.id,
        service_name=service_request.service,
    )

    return {
        "request_id": service_request.request_id,
        "status": RequestStatus.CONFIRMED,
        "message": (
            f"Appointment confirmed with "
            f"{selected_option.technician_name}."
        ),
        "appointment_options": [],
    }