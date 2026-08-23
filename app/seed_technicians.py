from sqlalchemy import select

from .database import SessionLocal
from .models_db import Service, Technician, technician_services


TECHNICIANS = {
    "Alex": ["tap repair", "shower repair"],
    "John": ["toilet repair"],
    "Sarah": ["tap repair", "leak investigation"],
}


db = SessionLocal()

for technician_name, service_names in TECHNICIANS.items():
    technician = db.scalar(
        select(Technician).where(Technician.name == technician_name)
    )

    if technician is None:
        technician = Technician(name=technician_name)
        db.add(technician)
        db.flush()

    for service_name in service_names:
        service = db.scalar(
            select(Service).where(Service.name == service_name)
        )

        if service is None:
            raise RuntimeError(
                f"Service '{service_name}' does not exist."
            )

        relationship_exists = db.execute(
            select(technician_services).where(
                technician_services.c.technician_id == technician.id,
                technician_services.c.service_id == service.id,
            )
        ).first()

        if relationship_exists is None:
            db.execute(
                technician_services.insert().values(
                    technician_id=technician.id,
                    service_id=service.id,
                )
            )

db.commit()
db.close()

print("Technician catalogue seeded successfully.")