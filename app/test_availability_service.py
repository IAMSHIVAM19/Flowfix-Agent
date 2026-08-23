from .database import SessionLocal
from .services.availability_service import get_available_technicians


db = SessionLocal()


print("Morning tap repair:")
technicians = get_available_technicians(
    db=db,
    service_name="tap repair",
    available_date="2026-08-27",
    start_time="09:00",
    end_time="12:00",
)

for technician in technicians:
    print(technician.name)


print("\nAfternoon tap repair:")
technicians = get_available_technicians(
    db=db,
    service_name="tap repair",
    available_date="2026-08-27",
    start_time="13:00",
    end_time="17:00",
)

for technician in technicians:
    print(technician.name)


print("\nAfternoon shower repair:")
technicians = get_available_technicians(
    db=db,
    service_name="shower repair",
    available_date="2026-08-27",
    start_time="13:00",
    end_time="17:00",
)

for technician in technicians:
    print(technician.name)


print("\nNon-existent service:")
technicians = get_available_technicians(
    db=db,
    service_name="pool repair",
    available_date="2026-08-27",
    start_time="09:00",
    end_time="12:00",
)

for technician in technicians:
    print(technician.name)


db.close()