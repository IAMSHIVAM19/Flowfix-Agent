from sqlalchemy import select

from ..database import SessionLocal
from ..models_db import AdminUser
from .security import hash_password


def create_admin():
    username = "admin"
    password = "change-me-now"

    db = SessionLocal()

    try:
        existing = db.scalar(
            select(AdminUser).where(
                AdminUser.username == username
            )
        )

        if existing:
            print("Admin user already exists.")
            return

        admin = AdminUser(
            username=username,
            password_hash=hash_password(password),
            is_active=True,
            role="admin",
        )

        db.add(admin)
        db.commit()

        print("Created admin user.")
        print(f"Username: {username}")
        print(f"Password: {password}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()