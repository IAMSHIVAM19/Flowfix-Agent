from sqlalchemy import select

from .database import SessionLocal
from .models_db import Technician, TechnicianAvailability


AVAILABILITY = {
    "Alex": [
        ("2026-08-27", "09:00", "12:00"),
    ],
    "John": [
        ("2026-08-27", "09:00", "17:00"),
    ],
    "Sarah": [
        ("2026-08-27", "13:00", "17:00"),
    ],
}


db = SessionLocal()

for technician_name, slots in AVAILABILITY.items():
    technician = db.scalar(
        select(Technician).where(
            Technician.name == technician_name
        )
    )

    if technician is None:
        raise RuntimeError(
            f"Technician '{technician_name}' does not exist."
        )

    for available_date, start_time, end_time in slots:
        existing_slot = db.scalar(
            select(TechnicianAvailability).where(
                TechnicianAvailability.technician_id == technician.id,
                TechnicianAvailability.available_date == available_date,
                TechnicianAvailability.start_time == start_time,
                TechnicianAvailability.end_time == end_time,
            )
        )

        if existing_slot is None:
            db.add(
                TechnicianAvailability(
                    technician_id=technician.id,
                    available_date=available_date,
                    start_time=start_time,
                    end_time=end_time,
                )
            )

db.commit()
db.close()

print("Technician availability seeded successfully.")
