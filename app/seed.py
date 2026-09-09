"""
Unified seeder script for FlowFix.
Seeds services, field technicians with skills, and 35-day rolling availability shifts.
"""
from sqlalchemy import select

from .database import SessionLocal
from .models_db import Service, Technician, technician_services
from .seed_services import SERVICES
from .seed_technicians import TECHNICIANS
from .seed_availability import seed_technician_availability
from .seed_showcase import seed_showcase_data


def seed_all(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 1. Services
        for service_name in SERVICES:
            existing = db.scalar(select(Service).where(Service.name == service_name))
            if not existing:
                db.add(Service(name=service_name))
        db.commit()

        # 2. Technicians & Specialty Capabilities
        for tech_name, services in TECHNICIANS.items():
            tech = db.scalar(select(Technician).where(Technician.name == tech_name))
            if not tech:
                tech = Technician(name=tech_name)
                db.add(tech)
                db.flush()

            for s_name in services:
                srv = db.scalar(select(Service).where(Service.name == s_name))
                if srv:
                    rel = db.execute(
                        select(technician_services).where(
                            technician_services.c.technician_id == tech.id,
                            technician_services.c.service_id == srv.id,
                        )
                    ).first()
                    if not rel:
                        db.execute(
                            technician_services.insert().values(
                                technician_id=tech.id,
                                service_id=srv.id,
                            )
                        )
        db.commit()

        # 3. 35-Day Rolling Availability Shifts
        seed_technician_availability(db)

        # 4. Realistic Showcase Data (Requests, Appointments, Customers)
        seed_showcase_data(db)

        print("Database successfully populated with services, technicians, availability, and showcase requests.")
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_all()
