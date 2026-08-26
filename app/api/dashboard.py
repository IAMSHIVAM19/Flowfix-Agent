from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import DashboardSummaryResponse, RequestStatus
from ..models_db import ServiceRequest


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    dependencies=[Depends(require_operations)],
)
def dashboard_summary(
    db: Session = Depends(get_db),
):
    total_requests = db.scalar(
        select(
            func.count(ServiceRequest.id)
        )
    )

    awaiting_information = db.scalar(
        select(
            func.count(ServiceRequest.id)
        ).where(
            ServiceRequest.status
            == RequestStatus.AWAITING_INFORMATION
        )
    )

    no_availability = db.scalar(
        select(
            func.count(ServiceRequest.id)
        ).where(
            ServiceRequest.status
            == RequestStatus.NO_AVAILABILITY
        )
    )

    awaiting_appointment_selection = db.scalar(
        select(
            func.count(ServiceRequest.id)
        ).where(
            ServiceRequest.status
            == RequestStatus.AWAITING_APPOINTMENT_SELECTION
        )
    )

    confirmed = db.scalar(
        select(
            func.count(ServiceRequest.id)
        ).where(
            ServiceRequest.status
            == RequestStatus.CONFIRMED
        )
    )

    return {
        "total_requests": (
            total_requests or 0
        ),
        "awaiting_information": (
            awaiting_information or 0
        ),
        "no_availability": (
            no_availability or 0
        ),
        "awaiting_appointment_selection": (
            awaiting_appointment_selection or 0
        ),
        "confirmed": confirmed or 0,
    }