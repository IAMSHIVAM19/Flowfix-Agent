from sqlalchemy import select

from .database import SessionLocal
from .models_db import Service


SERVICES = [
    "tap repair",
    "toilet repair",
    "shower repair",
    "leak investigation",
    "blocked drains",
    "hot water system",
    "burst pipe repair",
    "gas fitting",
    "roof plumbing",
    "backflow prevention",
]


def seed_services_table(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        for service_name in SERVICES:
            existing_service = db.scalar(
                select(Service).where(Service.name == service_name)
            )

            if not existing_service:
                db.add(Service(name=service_name))

        db.commit()
        print("Service catalogue seeded successfully.")
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_services_table()