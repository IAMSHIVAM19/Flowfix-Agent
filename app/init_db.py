"""
Database initialization and schema bootstrapping for FlowFix AI.
Safely handles fresh databases (creating all tables and stamping Alembic)
and existing databases (running incremental Alembic migrations).
"""
import os
from sqlalchemy import inspect
from .database import engine, SessionLocal
from .models_db import Base
from .seed import seed_all
from .auth.create_admin import create_admin


def init_database():
    print("Checking database schema and tables...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    # If the core tables don't exist yet, bootstrap all tables via SQLAlchemy metadata
    if "service_requests" not in existing_tables:
        print("Fresh database detected. Bootstrapping schema with Base.metadata.create_all()...")
        Base.metadata.create_all(bind=engine)
        print("All database tables created successfully.")

        # Stamp Alembic at head so it tracks future incremental migrations without failing
        try:
            from alembic.config import Config
            from alembic import command
            alembic_ini_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
            )
            if os.path.exists(alembic_ini_path):
                alembic_cfg = Config(alembic_ini_path)
                command.stamp(alembic_cfg, "head")
                print("Alembic schema stamped to head.")
        except Exception as e:
            print(f"Notice: Alembic stamp skipped ({e})")
    else:
        print("Existing database found. Applying any pending Alembic migrations...")
        try:
            from alembic.config import Config
            from alembic import command
            alembic_ini_path = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
            )
            if os.path.exists(alembic_ini_path):
                alembic_cfg = Config(alembic_ini_path)
                command.upgrade(alembic_cfg, "head")
                print("Alembic migrations completed successfully.")
        except Exception as e:
            print(f"Notice: Alembic upgrade skipped ({e})")

    # Ensure admin user exists
    try:
        create_admin()
    except Exception as e:
        print(f"Notice: Admin creation skipped ({e})")

    # Auto-seed initial catalog, technicians, and availability if unseeded
    try:
        with SessionLocal() as db:
            from sqlalchemy import select
            from .models_db import Service
            has_services = db.scalar(select(Service.id).limit(1))
            if not has_services:
                print("Seeding initial services, technicians, and availability...")
                seed_all(db)
            else:
                print("Catalog data is already seeded.")
    except Exception as e:
        print(f"Notice: Seeding check skipped ({e})")


if __name__ == "__main__":
    init_database()
