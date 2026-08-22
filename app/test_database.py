from .database import SessionLocal
from .services.request_service import create_customer


db = SessionLocal()

customer = create_customer(
    db,
    name="Test Customer",
    phone="0499999999",
    address="10 Test Street",
)

print(f"Customer created with ID: {customer.id}")
print(f"Name: {customer.name}")
print(f"Phone: {customer.phone}")
print(f"Address: {customer.address}")

db.close()