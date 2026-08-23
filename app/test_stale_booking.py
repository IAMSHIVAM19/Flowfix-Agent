from .database import SessionLocal
from .services.appointment_service import create_appointment


db = SessionLocal()

appointment = create_appointment(
    db=db,
    service_request_id=16,
    technician_id=3,
    service_name="tap repair",
    appointment_date="2026-08-28",
    start_time="13:00",
    end_time="17:00",
)

print(f"Competing appointment created: {appointment.id}")

db.close()