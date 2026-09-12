import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.database import SessionLocal
from app.models_db import Appointment, Customer, Notification, Service, ServiceRequest, Technician, technician_services
from app.api.technician_portal import get_current_technician


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_technician(db):
    tech = db.scalar(select(Technician).where(Technician.name == "Alex"))
    if not tech:
        tech = Technician(name="Alex", phone="0412 889 101", pin_code="1234", status="active")
        db.add(tech)
        db.flush()
    else:
        tech.pin_code = "1234"
        tech.phone = "0412 889 101"
        tech.status = "active"
        db.flush()

    # Ensure at least one service
    service = db.scalar(select(Service).where(Service.name == "tap repair"))
    if service:
        rel = db.execute(
            select(technician_services).where(
                technician_services.c.technician_id == tech.id,
                technician_services.c.service_id == service.id,
            )
        ).first()
        if not rel:
            db.execute(
                technician_services.insert().values(
                    technician_id=tech.id,
                    service_id=service.id,
                )
            )
    db.commit()
    db.refresh(tech)
    return tech


class TestTechnicianPortalAPI:
    def test_list_technicians(self, client, test_technician):
        response = client.get("/technician-api/list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        names = [t["name"] for t in data]
        assert "Alex" in names

    def test_technician_login_success(self, client, test_technician):
        response = client.post(
            "/technician-api/login",
            json={"username_or_id": "Alex", "pin": "1234"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["technician_name"] == "Alex"
        assert data["technician_id"] == test_technician.id

    def test_technician_login_invalid_pin(self, client, test_technician):
        response = client.post(
            "/technician-api/login",
            json={"username_or_id": "Alex", "pin": "9999"},
        )
        assert response.status_code == 401
        assert "Invalid technician PIN" in response.json()["detail"]

    def test_technician_me_profile(self, client, test_technician):
        login_res = client.post(
            "/technician-api/login",
            json={"username_or_id": "Alex", "pin": "1234"},
        )
        token = login_res.json()["access_token"]

        response = client.get(
            "/technician-api/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        profile = response.json()
        assert profile["name"] == "Alex"
        assert isinstance(profile["services"], list)

    def test_technician_booking_status_flow(self, client, db, test_technician):
        import uuid
        login_res = client.post(
            "/technician-api/login",
            json={"username_or_id": "Alex", "pin": "1234"},
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a test service request and appointment for Alex
        req = ServiceRequest(
            request_id=str(uuid.uuid4()),
            message="Kitchen mixer tap dripping",
            issue="dripping mixer tap",
            service="tap repair",
            urgency="normal",
            preferred_date=date.today().isoformat(),
            preferred_time="morning",
            status="confirmed",
        )
        db.add(req)
        db.flush()

        app = Appointment(
            service_request_id=req.id,
            technician_id=test_technician.id,
            appointment_date=date.today().isoformat(),
            start_time="09:00",
            end_time="12:00",
            status="confirmed",
        )
        db.add(app)
        db.commit()
        db.refresh(app)

        # 1. Fetch bookings
        bookings_res = client.get("/technician-api/bookings", headers=headers)
        assert bookings_res.status_code == 200
        bookings_data = bookings_res.json()
        assert bookings_data["up_next"] is not None
        assert bookings_data["up_next"]["quote_estimate"] is not None
        assert bookings_data["up_next"]["quote_estimate"]["estimated_min"] == 120

        # 2. Accept booking
        accept_res = client.patch(
            f"/technician-api/bookings/{app.id}/status",
            headers=headers,
            json={"status": "accepted"},
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "accepted"

        # 3. Mark en route
        route_res = client.patch(
            f"/technician-api/bookings/{app.id}/status",
            headers=headers,
            json={"status": "en_route"},
        )
        assert route_res.status_code == 200
        assert route_res.json()["status"] == "en_route"

        # 4. Decline with reason (or complete)
        decline_res = client.patch(
            f"/technician-api/bookings/{app.id}/status",
            headers=headers,
            json={"status": "declined", "reason": "Overrun on previous emergency job"},
        )
        assert decline_res.status_code == 200
        assert decline_res.json()["status"] == "declined"
        assert decline_res.json()["declined_reason"] == "Overrun on previous emergency job"

        # Verify service request status is updated to awaiting_technician
        db.refresh(req)
        assert req.status == "awaiting_technician"

        # Verify dispatch notification was created
        notification = db.scalar(
            select(Notification).where(
                Notification.notification_type == "technician_declined_booking",
                Notification.service_request_id == req.id,
            )
        )
        assert notification is not None
        assert "DECLINED" in notification.message

        # Clean up
        from sqlalchemy import delete
        db.execute(delete(Notification).where(Notification.service_request_id == req.id))
        db.execute(delete(Appointment).where(Appointment.id == app.id))
        db.execute(delete(ServiceRequest).where(ServiceRequest.id == req.id))
        db.commit()
