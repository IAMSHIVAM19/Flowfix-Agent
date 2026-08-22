from sqlalchemy import select

from .database import SessionLocal
from .models_db import Service


SERVICES = [
    "tap repair",
    "toilet repair",
    "shower repair",
    "leak investigation",
]


db = SessionLocal()

for service_name in SERVICES:
    existing_service = db.scalar(
        select(Service).where(Service.name == service_name)
    )

    if not existing_service:
        db.add(Service(name=service_name))

db.commit()

print("Service catalogue seeded successfully.")

db.close()