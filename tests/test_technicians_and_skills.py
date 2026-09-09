import pytest
from fastapi import HTTPException
from sqlalchemy import delete, select

from app.api.technicians import create_technician, list_services, list_technicians
from app.database import SessionLocal
from app.models import TechnicianCreateRequest
from app.models_db import Technician, TechnicianAvailability, technician_services


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


class TestTechnicianCreationAndValidation:
    def test_list_services(self, db):
        services = list_services(db)
        assert len(services) >= 10
        service_names = {s["name"] for s in services}
        assert "tap repair" in service_names
        assert "shower repair" in service_names
        assert "toilet repair" in service_names
        assert "leak investigation" in service_names
        assert "blocked drains" in service_names
        assert "hot water system" in service_names
        assert "burst pipe repair" in service_names
        assert "gas fitting" in service_names
        assert "roof plumbing" in service_names
        assert "backflow prevention" in service_names

    def test_create_technician_auto_seeds_availability(self, db):
        payload = TechnicianCreateRequest(
            name="Test Auto-Seeded Specialist",
            service_ids=[1, 2],
        )
        result = create_technician(payload, db)
        tech_id = result["id"]

        try:
            assert result["name"] == "Test Auto-Seeded Specialist"
            assert "tap repair" in result["services"]
            assert "toilet repair" in result["services"]

            # Verify rolling 35-day slots were created (35 * 2 = 70 slots)
            slots = list(
                db.scalars(
                    select(TechnicianAvailability).where(
                        TechnicianAvailability.technician_id == tech_id
                    )
                ).all()
            )
            assert len(slots) == 70

            # Verify slot times
            morning_slots = [s for s in slots if s.start_time == "09:00" and s.end_time == "12:00"]
            afternoon_slots = [s for s in slots if s.start_time == "13:00" and s.end_time == "17:00"]
            assert len(morning_slots) == 35
            assert len(afternoon_slots) == 35

        finally:
            db.execute(delete(TechnicianAvailability).where(TechnicianAvailability.technician_id == tech_id))
            db.execute(delete(technician_services).where(technician_services.c.technician_id == tech_id))
            db.execute(delete(Technician).where(Technician.id == tech_id))
            db.commit()

    def test_empty_name_rejected(self, db):
        payload = TechnicianCreateRequest(
            name="   ",
            service_ids=[1],
        )
        with pytest.raises(HTTPException) as exc_info:
            create_technician(payload, db)
        assert exc_info.value.status_code == 400
        assert "cannot be empty" in exc_info.value.detail

    def test_empty_services_rejected(self, db):
        from pydantic import ValidationError
        with pytest.raises(ValidationError):
            TechnicianCreateRequest(
                name="Valid Name",
                service_ids=[],
            )

    def test_invalid_service_id_rejected(self, db):
        payload = TechnicianCreateRequest(
            name="Valid Name",
            service_ids=[99999],
        )
        with pytest.raises(HTTPException) as exc_info:
            create_technician(payload, db)
        assert exc_info.value.status_code == 400
        assert "do not exist" in exc_info.value.detail

    def test_list_technicians_by_service_normalization(self, db):
        from app.tools.scheduling_tools import list_technicians

        # Verify filtering by exact service name
        techs = list_technicians(db, service_name="tap repair")
        assert len(techs) >= 1
        for t in techs:
            assert "tap repair" in t["certified_services"]

        # Verify filtering by raw alias that requires normalization
        techs_alias = list_technicians(db, service_name="leaking kitchen tap")
        assert len(techs_alias) >= 1
        for t in techs_alias:
            assert "tap repair" in t["certified_services"]
