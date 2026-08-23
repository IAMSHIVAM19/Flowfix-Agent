from .database import SessionLocal
from .services.appointment_service import create_appointment


db = SessionLocal()

try:
    create_appointment(
        db=db,
        service_request_id=11,
        technician_id=3,  # Sarah
        service_name="toilet repair",
        appointment_date="2026-08-27",
        start_time="13:00",
        end_time="17:00",
    )

    print("Unqualified booking incorrectly succeeded")

except ValueError as exc:
    print(f"Unqualified booking rejected: {exc}")

db.close()