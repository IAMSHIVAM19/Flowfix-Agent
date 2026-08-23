from .database import SessionLocal
from .services.technician_service import get_technicians_for_service


db = SessionLocal()

technicians = get_technicians_for_service(
    db,
    "tap repair",
)

for technician in technicians:
    print(technician.name)

db.close()