import uuid
from datetime import date, timedelta
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import delete, select

from app.api.requests import admin_book_appointment, get_request_appointment_options
from app.auth.dependencies import require_operations
from app.database import SessionLocal
from app.main import app
from app.models import AdminBookAppointmentRequest, RequestStatus, RequestUrgency
from app.models_db import (
    Appointment,
    ServiceRequest,
    ServiceRequestMessage,
    TechnicianAvailability,
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_request(db):
    """Creates an isolated service request for testing and cleans it up afterward."""
    req_uuid = str(uuid.uuid4())
    tomorrow_iso = (date.today() + timedelta(days=1)).isoformat()

    req = ServiceRequest(
        request_id=req_uuid,
        customer_id=None,
        message="Urgent tap leaking in kitchen",
        issue="dripping mixer tap",
        service="tap repair",
        urgency=RequestUrgency.HIGH,
        preferred_date=tomorrow_iso,
        preferred_time="morning",
        status=RequestStatus.AWAITING_APPOINTMENT_SELECTION,
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    yield req

    # Cleanup: messages and appointments first, then service request
    db.execute(
        delete(ServiceRequestMessage).where(
            ServiceRequestMessage.service_request_id == req.id
        )
    )
    db.execute(
        delete(Appointment).where(
            Appointment.service_request_id == req.id
        )
    )
    db.execute(
        delete(ServiceRequest).where(
            ServiceRequest.id == req.id
        )
    )
    db.commit()


class TestAdminBookingOptions:
    def test_get_options_nonexistent_request(self, db):
        with pytest.raises(HTTPException) as exc_info:
            get_request_appointment_options(
                request_id="non-existent-request-xyz",
                db=db,
            )
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()

    def test_get_options_for_unconfirmed_request(self, db, test_request):
        options = get_request_appointment_options(
            request_id=test_request.request_id,
            db=db,
        )
        assert isinstance(options, list)
        assert len(options) > 0

        first = options[0]
        assert first.technician_id is not None
        assert first.technician_name is not None
        assert first.start_time in ["09:00", "13:00"]

    def test_get_options_with_explicit_filters(self, db, test_request):
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        options = get_request_appointment_options(
            request_id=test_request.request_id,
            appointment_date=tomorrow,
            preferred_time="afternoon",
            service_name="toilet repair",
            db=db,
        )
        assert isinstance(options, list)
        for opt in options:
            assert opt.appointment_date == tomorrow
            assert opt.start_time == "13:00"
            assert opt.end_time == "17:00"


class TestAdminBookingExecution:
    def test_admin_book_nonexistent_request(self, db):
        payload = AdminBookAppointmentRequest(
            technician_id=1,
            appointment_date=date.today().isoformat(),
            start_time="09:00",
            end_time="12:00",
            service_name="tap repair",
        )
        with pytest.raises(HTTPException) as exc_info:
            admin_book_appointment(
                request_id="non-existent-req-9999",
                booking_data=payload,
                db=db,
            )
        assert exc_info.value.status_code == 404

    def test_admin_book_unqualified_technician_rejected(self, db, test_request):
        payload = AdminBookAppointmentRequest(
            technician_id=1,
            appointment_date="2099-12-31",  # No availability seeded for 2099
            start_time="09:00",
            end_time="12:00",
            service_name="tap repair",
        )
        with pytest.raises(HTTPException) as exc_info:
            admin_book_appointment(
                request_id=test_request.request_id,
                booking_data=payload,
                db=db,
            )
        assert exc_info.value.status_code == 400
        assert "not available" in exc_info.value.detail.lower()

    def test_admin_book_successful(self, db, test_request):
        options = get_request_appointment_options(
            request_id=test_request.request_id,
            db=db,
        )
        assert len(options) > 0
        chosen = options[0]

        payload = AdminBookAppointmentRequest(
            technician_id=chosen.technician_id,
            appointment_date=chosen.appointment_date,
            start_time=chosen.start_time,
            end_time=chosen.end_time,
            service_name="tap repair",
        )

        result = admin_book_appointment(
            request_id=test_request.request_id,
            booking_data=payload,
            db=db,
        )

        assert result["status"] == RequestStatus.CONFIRMED
        assert result["appointment"] is not None
        assert result["appointment"]["technician_id"] == chosen.technician_id
        assert result["appointment"]["appointment_date"] == chosen.appointment_date
        assert result["appointment"]["start_time"] == chosen.start_time
        assert result["appointment"]["end_time"] == chosen.end_time

        saved_appt = db.scalar(
            select(Appointment).where(
                Appointment.service_request_id == test_request.id
            )
        )
        assert saved_appt is not None
        assert saved_appt.status == "confirmed"

        messages = list(
            db.scalars(
                select(ServiceRequestMessage).where(
                    ServiceRequestMessage.service_request_id == test_request.id
                )
            ).all()
        )
        assert len(messages) >= 1
        assert "Appointment confirmed on behalf of customer" in messages[-1].message

    def test_admin_reschedule_existing_appointment(self, db, test_request):
        target_date = (date.today() + timedelta(days=15)).isoformat()
        first_payload = AdminBookAppointmentRequest(
            technician_id=1,
            appointment_date=target_date,
            start_time="09:00",
            end_time="12:00",
            service_name="tap repair",
        )
        first_result = admin_book_appointment(
            request_id=test_request.request_id,
            booking_data=first_payload,
            db=db,
        )
        assert first_result["appointment"]["start_time"] == "09:00"

        reschedule_payload = AdminBookAppointmentRequest(
            technician_id=1,
            appointment_date=target_date,
            start_time="13:00",
            end_time="17:00",
            service_name="tap repair",
        )
        updated_result = admin_book_appointment(
            request_id=test_request.request_id,
            booking_data=reschedule_payload,
            db=db,
        )
        assert updated_result["status"] == RequestStatus.CONFIRMED
        assert updated_result["appointment"]["start_time"] == "13:00"
        assert updated_result["appointment"]["end_time"] == "17:00"

        all_appts = list(
            db.scalars(
                select(Appointment).where(
                    Appointment.service_request_id == test_request.id
                )
            ).all()
        )
        assert len(all_appts) == 1
        assert all_appts[0].start_time == "13:00"

    def test_admin_double_booking_prevention(self, db, test_request):
        target_date = (date.today() + timedelta(days=15)).isoformat()
        payload = AdminBookAppointmentRequest(
            technician_id=1,
            appointment_date=target_date,
            start_time="09:00",
            end_time="12:00",
            service_name="tap repair",
        )
        admin_book_appointment(
            request_id=test_request.request_id,
            booking_data=payload,
            db=db,
        )

        second_uuid = str(uuid.uuid4())
        second_req = ServiceRequest(
            request_id=second_uuid,
            customer_id=None,
            message="Second customer problem",
            issue="dripping tap",
            service="tap repair",
            urgency=RequestUrgency.NORMAL,
            status=RequestStatus.AWAITING_APPOINTMENT_SELECTION,
        )
        db.add(second_req)
        db.commit()
        db.refresh(second_req)

        try:
            with pytest.raises(HTTPException) as exc_info:
                admin_book_appointment(
                    request_id=second_uuid,
                    booking_data=payload,
                    db=db,
                )
            assert exc_info.value.status_code == 400
            assert "overlapping" in exc_info.value.detail.lower()
        finally:
            db.execute(
                delete(Appointment).where(
                    Appointment.service_request_id == second_req.id
                )
            )
            db.execute(
                delete(ServiceRequestMessage).where(
                    ServiceRequestMessage.service_request_id == second_req.id
                )
            )
            db.execute(
                delete(ServiceRequest).where(
                    ServiceRequest.id == second_req.id
                )
            )
            db.commit()


class TestAdminBookingHttpEndpoints:
    def test_http_options_and_book_endpoint(self, db, test_request):
        class DummyAdmin:
            username = "dispatcher_test"
            role = "operations"
            is_active = True

        app.dependency_overrides[require_operations] = lambda: DummyAdmin()
        client = TestClient(app)

        try:
            resp = client.get(f"/requests/{test_request.request_id}/appointment-options")
            assert resp.status_code == 200
            options_data = resp.json()
            assert isinstance(options_data, list)
            assert len(options_data) > 0

            chosen = options_data[0]

            book_resp = client.post(
                f"/requests/{test_request.request_id}/admin-book",
                json={
                    "technician_id": chosen["technician_id"],
                    "appointment_date": chosen["appointment_date"],
                    "start_time": chosen["start_time"],
                    "end_time": chosen["end_time"],
                    "service_name": "tap repair",
                },
            )
            assert book_resp.status_code == 200
            data = book_resp.json()
            assert data["status"] == "confirmed"
            assert data["appointment"]["technician_id"] == chosen["technician_id"]
            assert data["appointment"]["technician_name"] == chosen["technician_name"]
            assert data["appointment"]["appointment_date"] == chosen["appointment_date"]

            get_resp = client.get(f"/requests/{test_request.request_id}")
            assert get_resp.status_code == 200
            get_data = get_resp.json()
            assert get_data["appointment"]["technician_name"] == chosen["technician_name"]
            assert get_data["appointment"]["technician_id"] == chosen["technician_id"]
        finally:
            app.dependency_overrides.clear()
