from sqlalchemy import select

from .database import SessionLocal
from .models import AppointmentOption
from .models_db import Appointment
from .services.confirmation_service import confirm_appointment


db = SessionLocal()

option = AppointmentOption(
    option_id="rollback-test",
    technician_id=2,
    technician_name="John",
    appointment_date="2026-08-27",
    start_time="13:00",
    end_time="14:00",
)

before_count = len(db.scalars(select(Appointment)).all())

try:
    confirm_appointment(
        db=db,
        option=option,
        service_request_id=999999,
        service_name="toilet repair",
    )
except Exception as exc:
    print(f"Confirmation failed as expected: {exc}")

after_count = len(db.scalars(select(Appointment)).all())

print(f"Appointments before: {before_count}")
print(f"Appointments after: {after_count}")

db.close()