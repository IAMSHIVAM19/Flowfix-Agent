from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth.dependencies import get_current_admin
from ..auth.security import (
    create_access_token,
    verify_password,
)
from ..database import get_db
from ..models import (
    AdminLoginRequest,
    AdminLoginResponse,
)
from ..models_db import AdminUser


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=AdminLoginResponse,
)
def admin_login(
    credentials: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    admin = db.scalar(
        select(AdminUser).where(
            AdminUser.username
            == credentials.username
        )
    )

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password.",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=403,
            detail="Admin account is inactive.",
        )

    if not verify_password(
        credentials.password,
        admin.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password.",
        )

    access_token = create_access_token(
        subject=admin.username,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# CURRENT ADMIN
# ============================================================

@router.get("/me")
def get_current_admin_info(
    current_admin=Depends(get_current_admin),
):
    return {
        "id": current_admin.id,
        "username": current_admin.username,
        "role": current_admin.role,
        "is_active": current_admin.is_active,
    }