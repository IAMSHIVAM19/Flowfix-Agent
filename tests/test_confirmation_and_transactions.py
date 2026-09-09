import uuid
import pytest
from sqlalchemy import delete, select

from app.database import SessionLocal
from app.models import (
    AppointmentOption,
    RequestStatus,
    RequestUrgency,
)
from app.models_db import (
    Appointment,
    ServiceRequest,
    TechnicianAvailability,
)
from app.services.confirmation_service import confirm_appointment


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


class TestAppointmentConfirmation:
    def test_successful_confirmation(self, db):
        request_id = str(uuid.uuid4())
        appointment_date = "2099-02-20"
        start_time = "09:00"
        end_time = "12:00"

        service_request = ServiceRequest(
            request_id=request_id,
            customer_id=None,
            message="Test confirmation",
            issue="dripping mixer tap",
            service="tap repair",
            urgency=RequestUrgency.NORMAL,
            preferred_date=appointment_date,
            preferred_time="morning",
            status=RequestStatus.AWAITING_APPOINTMENT_SELECTION,
        )
        db.add(service_request)

        # Ensure technician 1 has availability
        avail = TechnicianAvailability(
            technician_id=1,
            available_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
        )
        db.add(avail)
        db.commit()
        db.refresh(service_request)

        try:
            option = AppointmentOption(
                option_id="opt-test-1",
                technician_id=1,
                technician_name="Alex",
                appointment_date=appointment_date,
                start_time=start_time,
                end_time=end_time,
            )

            appt = confirm_appointment(
                db=db,
                option=option,
                service_request_id=service_request.id,
                service_name="tap repair",
            )

            assert appt.id is not None
            assert appt.status == "confirmed"

            # Check status of service request updated
            updated_req = db.scalar(select(ServiceRequest).where(ServiceRequest.id == service_request.id))
            assert updated_req.status == RequestStatus.CONFIRMED

        finally:
            db.execute(delete(Appointment).where(Appointment.service_request_id == service_request.id))
            db.execute(delete(ServiceRequest).where(ServiceRequest.id == service_request.id))
            db.execute(delete(TechnicianAvailability).where(TechnicianAvailability.id == avail.id))
            db.commit()

    def test_stale_booking_rejected(self, db):
        request_id = str(uuid.uuid4())
        appointment_date = "2099-02-21"
        start_time = "13:00"
        end_time = "17:00"

        service_request = ServiceRequest(
            request_id=request_id,
            customer_id=None,
            message="Test stale request",
            issue="clogged toilet",
            service="toilet repair",
            urgency=RequestUrgency.NORMAL,
            preferred_date=appointment_date,
            preferred_time="afternoon",
            status=RequestStatus.AWAITING_APPOINTMENT_SELECTION,
        )
        db.add(service_request)

        avail = TechnicianAvailability(
            technician_id=2,
            available_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
        )
        db.add(avail)
        db.commit()
        db.refresh(service_request)

        # Competing appointment taking slot
        competing = Appointment(
            service_request_id=service_request.id,
            technician_id=2,
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            status="confirmed",
        )
        db.add(competing)
        db.commit()

        try:
            stale_opt = AppointmentOption(
                option_id="opt-stale",
                technician_id=2,
                technician_name="John",
                appointment_date=appointment_date,
                start_time=start_time,
                end_time=end_time,
            )

            with pytest.raises(ValueError, match="overlapping appointment"):
                confirm_appointment(
                    db=db,
                    option=stale_opt,
                    service_request_id=service_request.id,
                    service_name="toilet repair",
                )

        finally:
            db.execute(delete(Appointment).where(Appointment.service_request_id == service_request.id))
            db.execute(delete(ServiceRequest).where(ServiceRequest.id == service_request.id))
            db.execute(delete(TechnicianAvailability).where(TechnicianAvailability.id == avail.id))
            db.commit()
