import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import (
    AppointmentConfirmation,
    CustomerInformationResponse,
    CustomerRequest,
    RequestDetailResponse,
    RequestExtraction,
    RequestListItem,
    RequestResponse,
    RequestStatus,
)
from ..models_db import (
    Appointment,
    Notification,
    ServiceRequest,
    ServiceRequestMessage,
)
from ..services.confirmation_service import confirm_appointment
from ..services.extraction_service import process_extraction
from ..services.llm_provider import get_extraction
from ..services.request_service import (
    create_service_request,
    get_customer_by_phone,
)
from ..services.scheduling_service import (
    get_options_for_extraction,
)
from ..services.scheduling_workflow import (
    process_scheduling,
)


router = APIRouter(
    prefix="/requests",
    tags=["Requests"],
)


# ============================================================
# CUSTOMER-FACING REQUEST CREATION
# ============================================================

@router.post(
    "",
    response_model=RequestResponse,
)
def create_request(
    request: CustomerRequest,
    db: Session = Depends(get_db),
):
    customer = get_customer_by_phone(
        db,
        request.phone,
    )

    if not customer:
        return {
            "request_id": str(uuid.uuid4()),
            "status": (
                RequestStatus.AWAITING_CUSTOMER_CONFIRMATION
            ),
            "message": (
                "We couldn't find a customer with this "
                "phone number. Please confirm that your "
                f"name is {request.name} and your address "
                f"is {request.address}."
            ),
            "appointment_options": [],
        }

    # --------------------------------------------------------
    # AI / mock extraction
    # --------------------------------------------------------

    extraction = get_extraction(
        message=request.message,
        current_date=date.today(),
    )

    # --------------------------------------------------------
    # Create initial service request
    # --------------------------------------------------------

    service_request = create_service_request(
        db=db,
        message=request.message,
        customer_id=customer.id,
        status=RequestStatus.RECEIVED,
        extraction=extraction,
    )

    # Save the original customer message.
    db.add(
        ServiceRequestMessage(
            service_request_id=service_request.id,
            role="customer",
            message=request.message.strip(),
        )
    )

    db.commit()
    db.refresh(service_request)

    # --------------------------------------------------------
    # Process extraction
    # --------------------------------------------------------

    extraction_result = process_extraction(
        extraction=extraction,
        db=db,
    )

    # --------------------------------------------------------
    # High-priority notification
    # --------------------------------------------------------

    if extraction.urgency == "high":
        db.add(
            Notification(
                service_request_id=service_request.id,
                recipient_type="admin",
                notification_type="high_priority_request",
                message=(
                    "A high-priority plumbing request "
                    "requires attention."
                ),
                status="simulated",
            )
        )

        db.commit()

    # --------------------------------------------------------
    # Information required from customer
    # --------------------------------------------------------

    if extraction_result.status in {
        "needs_clarification",
        "needs_follow_up",
    }:
        service_request.status = (
            RequestStatus.AWAITING_INFORMATION
        )

        # Save FlowFix's follow-up question.
        existing_question = db.scalar(
            select(ServiceRequestMessage).where(
                ServiceRequestMessage.service_request_id
                == service_request.id,
                ServiceRequestMessage.role == "assistant",
                ServiceRequestMessage.message
                == extraction_result.message,
            )
        )

        if existing_question is None:
            db.add(
                ServiceRequestMessage(
                    service_request_id=service_request.id,
                    role="assistant",
                    message=extraction_result.message,
                )
            )

        db.commit()
        db.refresh(service_request)

        return {
            "request_id": service_request.request_id,
            "status": service_request.status,
            "message": extraction_result.message,
            "appointment_options": [],
        }

    # --------------------------------------------------------
    # Safety fallback
    # --------------------------------------------------------

    if (
        extraction_result.extraction is None
        or extraction_result.status != "ready"
    ):
        service_request.status = (
            RequestStatus.AWAITING_INFORMATION
        )

        db.commit()
        db.refresh(service_request)

        return {
            "request_id": service_request.request_id,
            "status": service_request.status,
            "message": (
                extraction_result.message
                or (
                    "We need a little more information "
                    "before we can continue."
                )
            ),
            "appointment_options": [],
        }

    # --------------------------------------------------------
    # Scheduling
    # --------------------------------------------------------

    scheduling_result = process_scheduling(
        db=db,
        extraction=extraction_result.extraction,
    )

    # --------------------------------------------------------
    # No availability
    # --------------------------------------------------------

    if scheduling_result.status == "no_availability":
        service_request.status = (
            RequestStatus.NO_AVAILABILITY
        )

        db.commit()
        db.refresh(service_request)

        return {
            "request_id": service_request.request_id,
            "status": service_request.status,
            "message": scheduling_result.message,
            "appointment_options": [],
        }

    # --------------------------------------------------------
    # Appointment options available
    # --------------------------------------------------------

    service_request.status = (
        RequestStatus.AWAITING_APPOINTMENT_SELECTION
    )

    db.commit()
    db.refresh(service_request)

    return {
        "request_id": service_request.request_id,
        "status": service_request.status,
        "message": scheduling_result.message,
        "appointment_options": (
            scheduling_result.appointment_options
        ),
    }


# ============================================================
# CUSTOMER-FACING FOLLOW-UP INFORMATION
# ============================================================

@router.post(
    "/{request_id}/information",
    response_model=RequestResponse,
)
def provide_information(
    request_id: str,
    information: CustomerInformationResponse,
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

    if (
        service_request.status
        != RequestStatus.AWAITING_INFORMATION
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This service request is not waiting "
                "for additional information."
            ),
        )

    # --------------------------------------------------------
    # Save customer's answer
    # --------------------------------------------------------

    answer = information.message.strip()

    existing_answer = db.scalar(
        select(ServiceRequestMessage).where(
            ServiceRequestMessage.service_request_id
            == service_request.id,
            ServiceRequestMessage.role == "customer",
            ServiceRequestMessage.message == answer,
        )
    )

    if existing_answer is None:
        db.add(
            ServiceRequestMessage(
                service_request_id=service_request.id,
                role="customer",
                message=answer,
            )
        )

        db.commit()

    # --------------------------------------------------------
    # Rebuild request context
    # --------------------------------------------------------

    combined_message = (
        f"Original customer request:\n"
        f"{service_request.message}\n\n"
        f"Customer follow-up answer:\n"
        f"{answer}"
    )

    extraction = get_extraction(
        message=combined_message,
        current_date=date.today(),
    )

    # --------------------------------------------------------
    # Process updated extraction
    # --------------------------------------------------------

    extraction_result = process_extraction(
        extraction=extraction,
        db=db,
    )

    # --------------------------------------------------------
    # High-priority notification after follow-up
    # --------------------------------------------------------

    if extraction.urgency == "high":
        existing_notification = db.scalar(
            select(Notification).where(
                Notification.service_request_id
                == service_request.id,
                Notification.recipient_type == "admin",
                Notification.notification_type
                == "high_priority_request",
            )
        )

        if existing_notification is None:
            db.add(
                Notification(
                    service_request_id=service_request.id,
                    recipient_type="admin",
                    notification_type="high_priority_request",
                    message=(
                        "A high-priority plumbing request "
                        "requires attention."
                    ),
                    status="simulated",
                )
            )

            db.commit()

    # --------------------------------------------------------
    # Another follow-up is required
    # --------------------------------------------------------

    if extraction_result.status in {
        "needs_clarification",
        "needs_follow_up",
    }:
        service_request.status = (
            RequestStatus.AWAITING_INFORMATION
        )

        existing_question = db.scalar(
            select(ServiceRequestMessage).where(
                ServiceRequestMessage.service_request_id
                == service_request.id,
                ServiceRequestMessage.role == "assistant",
                ServiceRequestMessage.message
                == extraction_result.message,
            )
        )

        if existing_question is None:
            db.add(
                ServiceRequestMessage(
                    service_request_id=service_request.id,
                    role="assistant",
                    message=extraction_result.message,
                )
            )

        db.commit()
        db.refresh(service_request)

        return {
            "request_id": service_request.request_id,
            "status": service_request.status,
            "message": extraction_result.message,
            "appointment_options": [],
        }

    # --------------------------------------------------------
    # Safety fallback
    # --------------------------------------------------------

    if (
        extraction_result.extraction is None
        or extraction_result.status != "ready"
    ):
        service_request.status = (
            RequestStatus.AWAITING_INFORMATION
        )

        db.commit()
        db.refresh(service_request)

        return {
            "request_id": service_request.request_id,
            "status": service_request.status,
            "message": (
                extraction_result.message
                or (
                    "We need a little more information "
                    "before we can continue."
                )
            ),
            "appointment_options": [],
        }

    # --------------------------------------------------------
    # Continue to scheduling
    # --------------------------------------------------------

    scheduling_result = process_scheduling(
        db=db,
        extraction=extraction_result.extraction,
    )

    # --------------------------------------------------------
    # No availability
    # --------------------------------------------------------

    if scheduling_result.status == "no_availability":
        service_request.status = (
            RequestStatus.NO_AVAILABILITY
        )

        db.commit()
        db.refresh(service_request)

        return {
            "request_id": service_request.request_id,
            "status": service_request.status,
            "message": scheduling_result.message,
            "appointment_options": [],
        }

    # --------------------------------------------------------
    # Appointment options available
    # --------------------------------------------------------

    service_request.status = (
        RequestStatus.AWAITING_APPOINTMENT_SELECTION
    )

    db.commit()
    db.refresh(service_request)

    return {
        "request_id": service_request.request_id,
        "status": service_request.status,
        "message": scheduling_result.message,
        "appointment_options": (
            scheduling_result.appointment_options
        ),
    }


# ============================================================
# CUSTOMER-FACING REQUEST CONFIRMATION
# ============================================================

@router.post(
    "/{request_id}/confirm",
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

    if (
        service_request.status
        != RequestStatus.AWAITING_APPOINTMENT_SELECTION
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This service request cannot be confirmed."
            ),
        )

    extraction = RequestExtraction(
        issue=service_request.issue or "",
        service=service_request.service,
        urgency=service_request.urgency,
        preferred_date=service_request.preferred_date,
        preferred_weekday=None,
        preferred_time=service_request.preferred_time,
        needs_follow_up=False,
        follow_up_question=None,
    )

    options = get_options_for_extraction(
        db=db,
        extraction=extraction,
    )

    selected_option = next(
        (
            option
            for option in options
            if option.option_id
            == confirmation.option_id
        ),
        None,
    )

    if selected_option is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "The selected appointment option "
                "is no longer available."
            ),
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
            "Appointment confirmed with "
            f"{selected_option.technician_name}."
        ),
        "appointment_options": [],
    }


# ============================================================
# ADMIN REQUEST LIST
# ============================================================

@router.get(
    "",
    response_model=list[RequestListItem],
    dependencies=[Depends(require_operations)],
)
def list_requests(
    db: Session = Depends(get_db),
):
    statement = (
        select(ServiceRequest)
        .order_by(ServiceRequest.id.desc())
    )

    requests = list(
        db.scalars(statement).all()
    )

    return [
        {
            "id": service_request.id,
            "request_id": service_request.request_id,
            "customer_id": service_request.customer_id,
            "message": service_request.message,
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
        for service_request in requests
    ]


# ============================================================
# ADMIN REQUEST DETAIL
# ============================================================

@router.get(
    "/{request_id}",
    response_model=RequestDetailResponse,
    dependencies=[Depends(require_operations)],
)
def get_request(
    request_id: str,
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

    appointment = db.scalar(
        select(Appointment).where(
            Appointment.service_request_id
            == service_request.id
        )
    )

    return {
        "id": service_request.id,
        "request_id": service_request.request_id,
        "customer_id": service_request.customer_id,
        "message": service_request.message,
        "issue": service_request.issue,
        "service": service_request.service,
        "urgency": service_request.urgency,
        "preferred_date": service_request.preferred_date,
        "preferred_time": service_request.preferred_time,
        "status": service_request.status,
        "appointment": (
            {
                "id": appointment.id,
                "technician_id": appointment.technician_id,
                "appointment_date": (
                    appointment.appointment_date
                ),
                "start_time": appointment.start_time,
                "end_time": appointment.end_time,
                "status": appointment.status,
            }
            if appointment is not None
            else None
        ),
    }