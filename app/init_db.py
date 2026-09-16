"""
Database initialization and schema bootstrapping for FlowFix AI.
Safely handles fresh databases (creating all tables and stamping Alembic)
and existing databases (running incremental Alembic migrations).
"""
import os
from sqlalchemy import inspect, select
from .database import engine, SessionLocal
from .models_db import Base, Service
from .seed import seed_all
from .auth.create_admin import create_admin


def init_database():
    print("Checking database schema and tables...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    print(f"Detected existing tables: {existing_tables}")

    # 1. Guarantee all tables exist
    print("Ensuring all database tables exist via SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("All database tables verified/created successfully.")

    # 2. Track Alembic migrations
    alembic_ini_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
    )
    if os.path.exists(alembic_ini_path):
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config(alembic_ini_path)

        if "alembic_version" not in existing_tables:
            try:
                command.stamp(alembic_cfg, "head")
                print("Alembic schema stamped to head.")
            except Exception as e:
                print(f"Notice: Alembic stamp skipped ({e})")
        else:
            try:
                command.upgrade(alembic_cfg, "head")
                print("Alembic migrations completed successfully.")
            except Exception as e:
                print(f"Notice: Alembic upgrade skipped ({e})")

    # 3. Ensure default admin user exists
    try:
        create_admin()
    except Exception as e:
        print(f"Notice: Admin creation skipped ({e})")

    # 4. Auto-seed initial catalog, technicians, and availability if unseeded
    try:
        with SessionLocal() as db:
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
