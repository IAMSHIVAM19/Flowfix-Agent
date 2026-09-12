import uuid
from datetime import date, timedelta


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..agent.flowfix_agent import FlowFixAgent
from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import (
    AdminBookAppointmentRequest,
    AppointmentConfirmation,
    AppointmentOption,
    CustomerInformationResponse,
    CustomerConfirmationRequest,
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
    Technician,
)
from ..services.appointment_service import create_appointment
from ..services.confirmation_service import confirm_appointment
from ..services.extraction_service import process_extraction
from ..services.llm_provider import get_extraction
from ..services.request_service import (
    create_customer,
    create_service_request,
    get_customer_by_phone,
    merge_extraction_with_existing_request,
    update_service_request_from_extraction,
)
from ..services.scheduling_service import (
    get_appointment_options_for_request,
    get_options_for_extraction,
    normalize_time_slot,
)
from ..services.service_validation import normalize_service_name
from ..services.validation_service import (
    get_next_weekday_date,
    parse_natural_date_and_time,
)



from ..services.pricing_service import calculate_quote_estimate


def _make_quote_estimate(service: str | None, urgency=None):
    urgency_str = urgency.value if hasattr(urgency, "value") else str(urgency or "")
    return calculate_quote_estimate(service, urgency_str)


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
        # Persist the request so the customer can confirm their
        # identity and continue the same request afterwards.
        service_request = ServiceRequest(
            request_id=str(uuid.uuid4()),
            customer_id=None,
            message=request.message.strip(),
            issue=None,
            service=None,
            urgency=None,
            preferred_date=None,
            preferred_time=None,
            status=RequestStatus.AWAITING_CUSTOMER_CONFIRMATION,
        )

        db.add(service_request)
        db.flush()

        db.add(
            ServiceRequestMessage(
                service_request_id=service_request.id,
                role="customer",
                message=request.message.strip(),
            )
        )

        db.commit()
        db.refresh(service_request)

        return {
            "request_id": service_request.request_id,
            "status": service_request.status,
            "message": (
                "We couldn't find a customer with this "
                "phone number. Please confirm that your "
                f"name is {request.name} and your address "
                f"is {request.address}."
            ),
            "appointment_options": [],
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
        }

    # --------------------------------------------------------
    # AI / mock extraction
    # --------------------------------------------------------

    extraction = get_extraction(
        message=request.message,
        current_date=date.today(),
    )

    parsed_date, parsed_weekday, parsed_time = parse_natural_date_and_time(
        request.message,
        current_date=date.today(),
    )
    if extraction.preferred_date is None and parsed_date:
        extraction.preferred_date = parsed_date
    if extraction.preferred_weekday is None and parsed_weekday:
        extraction.preferred_weekday = parsed_weekday
    if extraction.preferred_time is None and parsed_time:
        extraction.preferred_time = parsed_time


    # --------------------------------------------------------
    # Process extraction
    #
    # This happens before creating the ServiceRequest so that
    # deterministic service/date normalization is persisted.
    # --------------------------------------------------------

    extraction_result = process_extraction(
        extraction=extraction,
        db=db,
    )

    # --------------------------------------------------------
    # Create initial service request using the processed
    # extraction state
    # --------------------------------------------------------

    service_request = create_service_request(
        db=db,
        message=request.message,
        customer_id=customer.id,
        status=RequestStatus.RECEIVED,
        extraction=(
            extraction_result.extraction
            or extraction
        ),
    )

    # --------------------------------------------------------
    # Save the original customer message
    # --------------------------------------------------------

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
    # High-priority notification
    # --------------------------------------------------------

    processed_extraction = (
        extraction_result.extraction
        or extraction
    )

    if processed_extraction.urgency == "high":
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
        }

    # --------------------------------------------------------
    # Agent-assisted scheduling
    # --------------------------------------------------------

    agent = FlowFixAgent(db)

    conversation = agent.get_conversation(
        service_request_id=service_request.id,
    )

    scheduling_result = agent.get_scheduling_result(
        extraction=extraction_result.extraction,
        conversation=conversation,
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
        }

    # --------------------------------------------------------
    # Appointment options available
    # --------------------------------------------------------

    service_request.status = (
        RequestStatus.AWAITING_APPOINTMENT_SELECTION
    )

    if scheduling_result.appointment_options:
        first_opt = scheduling_result.appointment_options[0]
        service_request.preferred_date = first_opt.appointment_date
        time_slot_name = "morning" if first_opt.start_time == "09:00" else "afternoon"
        service_request.preferred_time = time_slot_name

    db.commit()
    db.refresh(service_request)

    return {
        "request_id": service_request.request_id,
        "status": service_request.status,
        "message": scheduling_result.message,
        "appointment_options": (
            scheduling_result.appointment_options
        ),
        "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
    }


# ============================================================
# CUSTOMER-FACING CUSTOMER IDENTITY CONFIRMATION
# ============================================================

@router.post(
    "/{request_id}/confirm-customer",
    response_model=RequestResponse,
)
def confirm_customer(
    request_id: str,
    customer_data: CustomerConfirmationRequest,
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
        != RequestStatus.AWAITING_CUSTOMER_CONFIRMATION
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This service request is not waiting "
                "for customer confirmation."
            ),
        )

    customer = get_customer_by_phone(
        db,
        customer_data.phone.strip(),
    )

    if customer is None:
        customer = create_customer(
            db=db,
            name=customer_data.name.strip(),
            phone=customer_data.phone.strip(),
            address=customer_data.address.strip(),
        )
    else:
        if (
            customer.name.strip().lower()
            != customer_data.name.strip().lower()
            or customer.address.strip().lower()
            != customer_data.address.strip().lower()
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "The provided customer details do not "
                    "match the customer record for this phone number."
                ),
            )

    service_request.customer_id = customer.id

    db.add(
        ServiceRequestMessage(
            service_request_id=service_request.id,
            role="customer",
            message=(
                "Customer confirmed their identity: "
                f"{customer.name}, {customer.phone}, "
                f"{customer.address}."
            ),
        )
    )

    # Re-run the normal request pipeline now that the customer
    # identity has been confirmed. The original service request
    # is reused; no duplicate request is created.
    extraction = get_extraction(
        message=service_request.message,
        current_date=date.today(),
    )

    parsed_date, parsed_weekday, parsed_time = parse_natural_date_and_time(
        service_request.message,
        current_date=date.today(),
    )
    if extraction.preferred_date is None and parsed_date:
        extraction.preferred_date = parsed_date
    if extraction.preferred_weekday is None and parsed_weekday:
        extraction.preferred_weekday = parsed_weekday
    if extraction.preferred_time is None and parsed_time:
        extraction.preferred_time = parsed_time


    extraction_result = process_extraction(
        extraction=extraction,
        db=db,
    )

    processed_extraction = (
        extraction_result.extraction
        or extraction
    )

    if processed_extraction is not None:
        update_service_request_from_extraction(
            service_request=service_request,
            extraction=processed_extraction,
        )

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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
        }

    # --------------------------------------------------------
    # High-priority notification
    # --------------------------------------------------------

    if processed_extraction.urgency == "high":
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

    # --------------------------------------------------------
    # Agent-assisted scheduling
    # --------------------------------------------------------

    agent = FlowFixAgent(db)

    db.flush()

    conversation = agent.get_conversation(
        service_request_id=service_request.id,
    )

    scheduling_result = agent.get_scheduling_result(
        extraction=extraction_result.extraction,
        conversation=conversation,
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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
        "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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
    # Get the previous FlowFix question
    # --------------------------------------------------------

    previous_question = db.scalar(
        select(ServiceRequestMessage)
        .where(
            ServiceRequestMessage.service_request_id
            == service_request.id,
            ServiceRequestMessage.role == "assistant",
        )
        .order_by(
            ServiceRequestMessage.id.desc()
        )
    )

    previous_question_text = (
        previous_question.message
        if previous_question is not None
        else ""
    )

    # --------------------------------------------------------
    # Rebuild request context
    # --------------------------------------------------------

    combined_message = (
        f"Original customer request:\n"
        f"{service_request.message}\n\n"
        f"Previous FlowFix question:\n"
        f"{previous_question_text}\n\n"
        f"Customer's answer:\n"
        f"{answer}"
    )

    extraction = get_extraction(
        message=combined_message,
        current_date=date.today(),
    )

    # --------------------------------------------------------
    # Merge new extraction with existing request state
    # --------------------------------------------------------

    extraction = merge_extraction_with_existing_request(
        service_request=service_request,
        extraction=extraction,
    )

    # --------------------------------------------------------
    # Deterministic natural date/time parsing from customer answer
    # --------------------------------------------------------
    parsed_date, parsed_weekday, parsed_time = parse_natural_date_and_time(
        answer,
        current_date=date.today(),
    )
    if extraction.preferred_date is None and parsed_date:
        extraction.preferred_date = parsed_date
    if extraction.preferred_weekday is None and parsed_weekday:
        extraction.preferred_weekday = parsed_weekday
    if extraction.preferred_time is None and parsed_time:
        extraction.preferred_time = parsed_time

    # Crucial: Since the customer answered the follow-up clarification,
    # prevent the local LLM from looping with repeated questions.
    extraction.needs_follow_up = False
    extraction.follow_up_question = None

    # If the user gave a weekday or date was not set, resolve properly
    if extraction.preferred_date is None:
        if extraction.preferred_weekday:
            extraction.preferred_date = get_next_weekday_date(
                extraction.preferred_weekday, date.today()
            )
        elif extraction.urgency == "high" or any(
            w in answer.lower() for w in ["today", "asap", "urgent", "now"]
        ):
            extraction.preferred_date = date.today().isoformat()
        else:
            extraction.preferred_date = (
                date.today() + timedelta(days=1)
            ).isoformat()

    # Always synchronize preferred_weekday with preferred_date
    if extraction.preferred_date:
        try:
            parsed_d = date.fromisoformat(extraction.preferred_date)
            extraction.preferred_weekday = parsed_d.strftime("%A")
        except ValueError:
            pass

    # If preferred_time is still None, default to morning
    if extraction.preferred_time is None:
        extraction.preferred_time = "morning"

    # If urgency is still None, default to normal
    if extraction.urgency is None:
        extraction.urgency = "normal"


    # --------------------------------------------------------
    # Process updated extraction
    # --------------------------------------------------------

    extraction_result = process_extraction(
        extraction=extraction,
        db=db,
    )

    # --------------------------------------------------------
    # Update persisted request state
    # --------------------------------------------------------

    if (
        extraction_result.extraction is not None
        and extraction_result.status == "ready"
    ):
        update_service_request_from_extraction(
            service_request=service_request,
            extraction=extraction_result.extraction,
        )

        db.commit()
        db.refresh(service_request)

    # --------------------------------------------------------
    # High-priority notification after follow-up
    # --------------------------------------------------------

    processed_extraction = (
        extraction_result.extraction
        or extraction
    )

    if processed_extraction.urgency == "high":
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
        }

    # --------------------------------------------------------
    # Agent-assisted scheduling after follow-up
    # --------------------------------------------------------

    agent = FlowFixAgent(db)

    conversation = agent.get_conversation(
        service_request_id=service_request.id,
    )

    scheduling_result = agent.get_scheduling_result(
        extraction=extraction_result.extraction,
        conversation=conversation,
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
        }

    # --------------------------------------------------------
    # Appointment options available
    # --------------------------------------------------------

    service_request.status = (
        RequestStatus.AWAITING_APPOINTMENT_SELECTION
    )

    if scheduling_result.appointment_options:
        first_opt = scheduling_result.appointment_options[0]
        service_request.preferred_date = first_opt.appointment_date
        time_slot_name = "morning" if first_opt.start_time == "09:00" else "afternoon"
        service_request.preferred_time = time_slot_name

    db.commit()
    db.refresh(service_request)

    return {
        "request_id": service_request.request_id,
        "status": service_request.status,
        "message": scheduling_result.message,
        "appointment_options": (
            scheduling_result.appointment_options
        ),
        "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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
        "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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
            "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
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

    technician_name = None
    if appointment is not None:
        tech = db.scalar(
            select(Technician).where(Technician.id == appointment.technician_id)
        )
        if tech:
            technician_name = tech.name

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
                "technician_name": technician_name,
                "appointment_date": (
                    appointment.appointment_date
                ),
                "start_time": appointment.start_time,
                "end_time": appointment.end_time,
                "status": appointment.status,
                "declined_reason": getattr(appointment, "declined_reason", None),
                "technician_notes": getattr(appointment, "technician_notes", None),
            }
            if appointment is not None
            else None
        ),
        "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
    }


# ============================================================
# ADMIN / DISPATCHER APPOINTMENT BOOKING ON BEHALF OF CUSTOMER
# ============================================================

@router.get(
    "/{request_id}/appointment-options",
    response_model=list[AppointmentOption],
    dependencies=[Depends(require_operations)],
)
def get_request_appointment_options(
    request_id: str,
    appointment_date: str | None = None,
    preferred_time: str | None = None,
    service_name: str | None = None,
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

    raw_service = service_name or service_request.service or service_request.issue or "tap repair"
    target_service = normalize_service_name(raw_service) or "tap repair"

    if appointment_date and appointment_date.strip():
        target_date = appointment_date.strip()
    elif service_request.preferred_date:
        target_date = service_request.preferred_date
    else:
        target_date = date.today().isoformat()

    raw_time = (preferred_time or service_request.preferred_time or "morning").strip().lower()
    if "afternoon" in raw_time or "pm" in raw_time or "13" in raw_time:
        target_time = "afternoon"
    else:
        target_time = "morning"

    options = get_appointment_options_for_request(
        db=db,
        service_name=target_service,
        appointment_date=target_date,
        preferred_time=target_time,
    )

    return options


@router.post(
    "/{request_id}/admin-book",
    response_model=RequestDetailResponse,
    dependencies=[Depends(require_operations)],
)
def admin_book_appointment(
    request_id: str,
    booking_data: AdminBookAppointmentRequest,
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

    raw_service = (
        booking_data.service_name
        or service_request.service
        or service_request.issue
        or "tap repair"
    )
    target_service = normalize_service_name(raw_service) or "tap repair"

    # Allow rebooking: if an appointment already existed for this request, delete it first
    existing_appointment = db.scalar(
        select(Appointment).where(
            Appointment.service_request_id == service_request.id
        )
    )
    if existing_appointment is not None:
        db.delete(existing_appointment)
        db.flush()

    try:
        appointment = create_appointment(
            db=db,
            service_request_id=service_request.id,
            technician_id=booking_data.technician_id,
            service_name=target_service,
            appointment_date=booking_data.appointment_date,
            start_time=booking_data.start_time,
            end_time=booking_data.end_time,
            status="confirmed",
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    service_request.status = RequestStatus.CONFIRMED
    if not service_request.service:
        service_request.service = target_service
    service_request.preferred_date = booking_data.appointment_date
    service_request.preferred_time = (
        "morning" if booking_data.start_time == "09:00" else "afternoon"
    )

    db.add(
        ServiceRequestMessage(
            service_request_id=service_request.id,
            role="assistant",
            message=(
                f"Appointment confirmed on behalf of customer: "
                f"{appointment.appointment_date} "
                f"({appointment.start_time} - {appointment.end_time}) "
                f"with technician ID #{appointment.technician_id}."
            ),
        )
    )

    db.commit()
    db.refresh(service_request)
    db.refresh(appointment)

    tech = db.scalar(
        select(Technician).where(Technician.id == appointment.technician_id)
    )
    technician_name = tech.name if tech else None

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
        "appointment": {
            "id": appointment.id,
            "technician_id": appointment.technician_id,
            "technician_name": technician_name,
            "appointment_date": appointment.appointment_date,
            "start_time": appointment.start_time,
            "end_time": appointment.end_time,
            "status": appointment.status,
            "declined_reason": getattr(appointment, "declined_reason", None),
            "technician_notes": getattr(appointment, "technician_notes", None),
        },
        "quote_estimate": _make_quote_estimate(service_request.service, service_request.urgency),
    }