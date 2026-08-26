from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.dependencies import require_admin
from ..auth.security import hash_password
from ..database import get_db
from ..models import (
    AdminUserCreateRequest,
    AdminUserResponse,
    AdminUserRoleUpdateRequest,
    AdminUserStatusUpdateRequest,
)
from ..models_db import AdminUser

from ..models import (
    AdminUserCreateRequest,
    AdminUserResponse,
    AdminUserRoleUpdateRequest,
    AdminUserStatusUpdateRequest,
)
router = APIRouter(
    prefix="/admin",
    tags=["Administration"],
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