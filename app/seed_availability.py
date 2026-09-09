from datetime import date, timedelta
from sqlalchemy import select

from .database import SessionLocal
from .models_db import Technician, TechnicianAvailability


HISTORICAL_AVAILABILITY = {
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


def seed_technician_availability(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Seed historical slots
        for technician_name, slots in HISTORICAL_AVAILABILITY.items():
            technician = db.scalar(
                select(Technician).where(
                    Technician.name == technician_name
                )
            )
            if technician is None:
                continue

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

        # Seed rolling 30-day availability starting from today
        today = date.today()
        technicians = list(db.scalars(select(Technician)).all())

        for day_offset in range(35):
            slot_date = (today + timedelta(days=day_offset)).isoformat()

            for tech in technicians:
                # Add morning slot (09:00 - 12:00)
                morning_slot = db.scalar(
                    select(TechnicianAvailability).where(
                        TechnicianAvailability.technician_id == tech.id,
                        TechnicianAvailability.available_date == slot_date,
                        TechnicianAvailability.start_time == "09:00",
                        TechnicianAvailability.end_time == "12:00",
                    )
                )
                if morning_slot is None:
                    db.add(
                        TechnicianAvailability(
                            technician_id=tech.id,
                            available_date=slot_date,
                            start_time="09:00",
                            end_time="12:00",
                        )
                    )

                # Add afternoon slot (13:00 - 17:00)
                afternoon_slot = db.scalar(
                    select(TechnicianAvailability).where(
                        TechnicianAvailability.technician_id == tech.id,
                        TechnicianAvailability.available_date == slot_date,
                        TechnicianAvailability.start_time == "13:00",
                        TechnicianAvailability.end_time == "17:00",
                    )
                )
                if afternoon_slot is None:
                    db.add(
                        TechnicianAvailability(
                            technician_id=tech.id,
                            available_date=slot_date,
                            start_time="13:00",
                            end_time="17:00",
                        )
                    )

        db.commit()
        print("Technician availability seeded successfully for rolling 35 days.")
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_technician_availability()
