from sqlalchemy import select

from .database import SessionLocal
from .models import AppointmentOption, RequestStatus
from .models_db import ServiceRequest
from .services.confirmation_service import confirm_appointment


db = SessionLocal()

option = AppointmentOption(
    option_id="test-confirmation-option",
    technician_id=2,
    technician_name="John",
    appointment_date="2026-08-27",
    start_time="09:00",
    end_time="17:00",
)

appointment = confirm_appointment(
    db=db,
    option=option,
    service_request_id=11,
    service_name="tap repair",
)

service_request = db.scalar(
    select(ServiceRequest).where(
        ServiceRequest.id == 11
    )
)

print(f"Appointment created: {appointment.id}")
print(f"Appointment status: {appointment.status}")
print(f"Request status: {service_request.status}")
print(f"Expected request status: {RequestStatus.CONFIRMED}")

db.close()