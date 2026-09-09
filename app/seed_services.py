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