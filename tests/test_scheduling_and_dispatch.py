import pytest
from app.database import SessionLocal
from app.models import RequestExtraction, RequestUrgency
from app.models_db import Appointment, Service, Technician, TechnicianAvailability, technician_services
from app.services.appointment_service import (
    has_overlapping_appointment,
    is_technician_qualified,
    is_within_availability,
)
from app.services.scheduling_service import (
    find_available_technicians_for_request,
    get_options_for_extraction,
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


class TestSchedulingQualification:
    def test_technician_qualification_check(self, db):
        # Alex (id=1) is qualified for tap repair
        assert is_technician_qualified(db, technician_id=1, service_name="tap repair") is True
        # Check invalid service
        assert is_technician_qualified(db, technician_id=1, service_name="invalid plumbing trade") is False

    def test_availability_matching(self, db):
        # Ben (id=4) has rolling availability
        # We can check a known slot date
        from datetime import date
        today_iso = date.today().isoformat()

        # Morning slot check
        is_avail = is_within_availability(
            db=db,
            technician_id=1,
            appointment_date=today_iso,
            start_time="09:00",
            end_time="12:00",
        )
        # Should be available since availability was seeded for 35 days
        assert is_avail is True

        # Impossible midnight slot check
        is_midnight = is_within_availability(
            db=db,
            technician_id=1,
            appointment_date=today_iso,
            start_time="02:00",
            end_time="04:00",
        )
        assert is_midnight is False


class TestOverlappingAppointments:
    def test_overlapping_detection(self, db):
        # Create a temporary dummy appointment for collision testing
        temp_appt = Appointment(
            service_request_id=1,
            technician_id=1,
            appointment_date="2099-12-31",
            start_time="09:00",
            end_time="12:00",
            status="confirmed",
        )
        db.add(temp_appt)
        db.flush()

        try:
            # Exact overlap
            assert has_overlapping_appointment(
                db, 1, "2099-12-31", "09:00", "12:00"
            ) is True

            # Partial inside overlap
            assert has_overlapping_appointment(
                db, 1, "2099-12-31", "10:00", "11:00"
            ) is True

            # Non-overlapping adjacent slot
            assert has_overlapping_appointment(
                db, 1, "2099-12-31", "13:00", "17:00"
            ) is False

            # Non-overlapping different date
            assert has_overlapping_appointment(
                db, 1, "2099-12-30", "09:00", "12:00"
            ) is False
        finally:
            db.rollback()


class TestOptionsForExtraction:
    def test_options_for_tap_repair(self, db):
        from datetime import date, timedelta
        target_date = (date.today() + timedelta(days=1)).isoformat()

        extraction = RequestExtraction(
            issue="dripping kitchen tap",
            service="tap repair",
            urgency=RequestUrgency.NORMAL,
            preferred_date=target_date,
            preferred_time="morning",
        )

        options = get_options_for_extraction(db, extraction)
        assert len(options) > 0
        for opt in options:
            assert opt.appointment_date == target_date
            assert opt.start_time == "09:00"
            assert opt.end_time == "12:00"

    def test_empty_options_on_unsupported_service(self, db):
        from datetime import date, timedelta
        target_date = (date.today() + timedelta(days=1)).isoformat()

        extraction = RequestExtraction(
            issue="roof replacement",
            service="roofing repair",
            urgency=RequestUrgency.NORMAL,
            preferred_date=target_date,
            preferred_time="morning",
        )

        options = get_options_for_extraction(db, extraction)
        assert len(options) == 0

    def test_is_slot_in_past(self):
        from datetime import date, datetime, timedelta
        from app.services.scheduling_service import is_slot_in_past

        simulated_now = datetime(2026, 9, 9, 15, 30)

        # Yesterday's slot is always in the past
        yesterday = (simulated_now.date() - timedelta(days=1)).isoformat()
        assert is_slot_in_past(yesterday, "09:00", now=simulated_now) is True

        # Today's morning slot at 15:30 is in the past
        today = simulated_now.date().isoformat()
        assert is_slot_in_past(today, "09:00", now=simulated_now) is True
        assert is_slot_in_past(today, "13:00", now=simulated_now) is True

        # Tomorrow's slot is never in the past
        tomorrow = (simulated_now.date() + timedelta(days=1)).isoformat()
        assert is_slot_in_past(tomorrow, "09:00", now=simulated_now) is False

        # If simulated_now is early morning (08:00), today's 09:00 slot is in the future
        early_now = datetime(2026, 9, 9, 8, 0)
        assert is_slot_in_past(today, "09:00", now=early_now) is False

