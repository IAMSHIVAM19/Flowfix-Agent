from .database import SessionLocal
from .models import RequestStatus
from .models_db import ServiceRequest
from .services.mock_llm_service import mock_extract_complete_request
from .services.request_service import create_service_request


db = SessionLocal()

extraction = mock_extract_complete_request()

service_request = create_service_request(
    db=db,
    message="My kitchen tap has been leaking since this morning.",
    customer_id=1,
    status=RequestStatus.RECEIVED,
    extraction=extraction,
)

print(f"Request ID: {service_request.request_id}")
print(f"Issue: {service_request.issue}")
print(f"Service: {service_request.service}")
print(f"Urgency: {service_request.urgency}")
print(f"Preferred date: {service_request.preferred_date}")
print(f"Preferred time: {service_request.preferred_time}")

db.close()
