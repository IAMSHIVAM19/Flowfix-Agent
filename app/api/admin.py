from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..agent.flowfix_agent import FlowFixAgent
from ..auth.dependencies import require_admin
from ..auth.security import hash_password
from ..database import get_db
from ..models import (
    AdminUserCreateRequest,
    AdminUserResponse,
    AdminUserRoleUpdateRequest,
    AdminUserStatusUpdateRequest,
    AgentOperationRequest,
    AgentResult,
    NotificationResponse,
    NotificationStatusUpdateRequest,
)
from ..models_db import (
    AdminUser,
    Appointment,
    Notification,
    ServiceRequest,
)


router = APIRouter(
    prefix="/admin",
    tags=["Administration"],
)


# ============================================================
# ADMIN AGENT OPERATIONS
# ============================================================

@router.post(
    "/agent",
    response_model=AgentResult,
    dependencies=[Depends(require_admin)],
)
def run_agent_operation(
    operation: AgentOperationRequest,
    db: Session = Depends(get_db),
):
    print("\n" + "=" * 60)
    print("FLOWFIX AGENT DEBUG")
    print("=" * 60)

    message = operation.message.strip()
    if not message:
        raise HTTPException(
            status_code=400,
            detail="Operation message cannot be empty.",
        )

    agent = FlowFixAgent(db)

    service_request = None
    conversation = None
    appointment = None

    # --------------------------------------------------------
    # Load request context when a request ID is supplied.
    # --------------------------------------------------------

    print(
        "Request ID received:",
        operation.request_id,
    )

    if operation.request_id:
        service_request = db.scalar(
            select(ServiceRequest).where(
                ServiceRequest.request_id
                == operation.request_id
            )
        )

        print(
            "Service request found:",
            service_request is not None,
        )

        if service_request is None:
            print(
                "ERROR: Service request was not found."
            )

            raise HTTPException(
                status_code=404,
                detail="Service request not found.",
            )

        print(
            "Service request database ID:",
            service_request.id,
        )

        conversation = agent.get_conversation(
            service_request_id=service_request.id,
        )

        print(
            "Conversation messages:",
            len(conversation),
        )

        # ----------------------------------------------------
        # Load the current appointment for this request.
        # ----------------------------------------------------

        appointment = db.scalar(
            select(Appointment)
            .where(
                Appointment.service_request_id
                == service_request.id
            )
            .order_by(
                Appointment.id.desc()
            )
        )

        print(
            "Appointment found:",
            appointment is not None,
        )

        if appointment is not None:
            print(
                "Appointment ID:",
                appointment.id,
            )
            print(
                "Appointment service request ID:",
                appointment.service_request_id,
            )
            print(
                "Appointment technician ID:",
                appointment.technician_id,
            )
            print(
                "Appointment date:",
                appointment.appointment_date,
            )
            print(
                "Appointment time:",
                appointment.start_time,
                "-",
                appointment.end_time,
            )
            print(
                "Appointment status:",
                appointment.status,
            )
        else:
            print(
                "Appointment lookup returned None."
            )

    else:
        print(
            "NO REQUEST ID WAS PROVIDED."
        )

    # --------------------------------------------------------
    # Run the general operations agent.
    # --------------------------------------------------------

    print("-" * 60)
    print(
        "Passing appointment to FlowFixAgent:",
        appointment is not None,
    )

    if appointment is not None:
        print(
            "Passing appointment ID:",
            appointment.id,
        )

    print("-" * 60)

    try:
        result = agent.run_operation(
            message=message,
            conversation=conversation,
            service_request=service_request,
            appointment=appointment,
        )

        print(
            "Agent operation completed."
        )

        print(
            "Agent status:",
            result.status,
        )

        print(
            "Tool calls:",
            len(result.tool_calls),
        )

        print("=" * 60)
        print()

        return result

    except Exception as exc:
        import traceback
        traceback.print_exc()
        print(
            "AGENT ERROR:",
            repr(exc),
        )

        print("=" * 60)
        print()

        raise HTTPException(
            status_code=500,
            detail=(
                "The FlowFix agent could not process "
                f"the operation: {exc}"
            ),
        )


# ============================================================
# ADMIN USER LIST
# ============================================================

@router.get(
    "/users",
    response_model=list[AdminUserResponse],
    dependencies=[Depends(require_admin)],
)
def list_admin_users(
    db: Session = Depends(get_db),
):
    statement = (
        select(AdminUser)
        .order_by(AdminUser.id)
    )

    users = list(
        db.scalars(statement).all()
    )

    return [
        {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]


# ============================================================
# CREATE ADMIN USER
# ============================================================

@router.post(
    "/users",
    response_model=AdminUserResponse,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
def create_admin_user(
    user_data: AdminUserCreateRequest,
    db: Session = Depends(get_db),
):
    existing_user = db.scalar(
        select(AdminUser).where(
            AdminUser.username
            == user_data.username
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "A user with that username "
                "already exists."
            ),
        )

    new_user = AdminUser(
        username=user_data.username,
        password_hash=hash_password(
            user_data.password
        ),
        is_active=True,
        role=user_data.role,
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create admin user.",
        )

    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role,
        "is_active": new_user.is_active,
    }


# ============================================================
# ACTIVATE / DEACTIVATE USER
# ============================================================

@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserResponse,
)
def update_admin_user_status(
    user_id: int,
    status_update: AdminUserStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    user = db.scalar(
        select(AdminUser).where(
            AdminUser.id == user_id
        )
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Admin user not found.",
        )

    if (
        user.id == current_admin.id
        and not status_update.is_active
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot deactivate "
                "your own account."
            ),
        )

    user.is_active = status_update.is_active

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to update "
                "admin user status."
            ),
        )

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
    }


# ============================================================
# UPDATE ADMIN USER ROLE
# ============================================================

@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
)
def update_admin_user_role(
    user_id: int,
    role_update: AdminUserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    user = db.scalar(
        select(AdminUser).where(
            AdminUser.id == user_id
        )
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Admin user not found.",
        )

    user.role = role_update.role

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update admin user role.",
        )

    return {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
    }


# ============================================================
# ACKNOWLEDGE NOTIFICATION
# ============================================================

@router.patch(
    "/notifications/{notification_id}/status",
    response_model=NotificationResponse,
)
def update_notification_status(
    notification_id: int,
    status_update: NotificationStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    notification = db.scalar(
        select(Notification).where(
            Notification.id == notification_id
        )
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    notification.status = status_update.status

    try:
        db.commit()
        db.refresh(notification)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to update notification status.",
        )

    return {
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