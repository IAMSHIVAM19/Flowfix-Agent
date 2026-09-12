from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_operations
from ..database import get_db
from ..models import DashboardSummaryResponse, RequestStatus, NotificationResponse
from ..models_db import Notification, ServiceRequest


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

    awaiting_technician = db.scalar(
        select(
            func.count(ServiceRequest.id)
        ).where(
            ServiceRequest.status
            == RequestStatus.AWAITING_TECHNICIAN
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
        "awaiting_technician": awaiting_technician or 0,
    }


@router.get(
    "/notifications",
    response_model=list[NotificationResponse],
    dependencies=[Depends(require_operations)],
)
def dashboard_notifications(
    db: Session = Depends(get_db),
):
    notifications = list(
        db.scalars(
            select(Notification)
            .order_by(Notification.id.desc())
        ).all()
    )

    return [
        {
            "id": notification.id,
            "service_request_id": (
                notification.service_request_id
            ),
            "recipient_type": (
                notification.recipient_type
            ),
            "notification_type": (
                notification.notification_type
            ),
            "message": notification.message,
            "status": notification.status,
        }
        for notification in notifications
    ]