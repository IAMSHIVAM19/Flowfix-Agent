from .database import SessionLocal
from .services.service_validation import get_service_by_name


db = SessionLocal()

service = get_service_by_name(db, "Tap Repair")

if service:
    print(f"Service found: {service.name}")
else:
    print("Service not found")

service = get_service_by_name(db, "random plumbing thing")

if service:
    print(f"Service found: {service.name}")
else:
    print("Service not found")

db.close()