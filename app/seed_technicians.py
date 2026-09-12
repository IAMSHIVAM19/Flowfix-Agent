from sqlalchemy import select

from .database import SessionLocal
from .models_db import Service, Technician, technician_services


TECHNICIANS = {
    "Alex": {
        "services": ["tap repair", "shower repair", "hot water system", "burst pipe repair"],
        "phone": "0412 889 101",
        "pin": "1234",
    },
    "John": {
        "services": ["toilet repair", "blocked drains", "burst pipe repair", "tap repair"],
        "phone": "0423 456 789",
        "pin": "1234",
    },
    "Sarah": {
        "services": ["leak investigation", "roof plumbing", "backflow prevention", "shower repair"],
        "phone": "0434 567 890",
        "pin": "1234",
    },
    "Ben": {
        "services": ["gas fitting", "hot water system", "blocked drains", "leak investigation"],
        "phone": "0445 678 901",
        "pin": "1234",
    },
}


db = SessionLocal()

for technician_name, tech_data in TECHNICIANS.items():
    service_names = tech_data["services"]
    technician = db.scalar(
        select(Technician).where(Technician.name == technician_name)
    )

    if technician is None:
        technician = Technician(
            name=technician_name,
            phone=tech_data["phone"],
            pin_code=tech_data["pin"],
            status="active",
        )
        db.add(technician)
        db.flush()
    else:
        if not technician.phone:
            technician.phone = tech_data["phone"]
        if not technician.pin_code:
            technician.pin_code = tech_data["pin"]
        if not technician.status:
            technician.status = "active"

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