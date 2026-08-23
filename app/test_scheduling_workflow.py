from .database import SessionLocal
from .services.mock_llm_service import mock_extract_complete_request
from .services.scheduling_workflow import process_scheduling


db = SessionLocal()

extraction = mock_extract_complete_request()

result = process_scheduling(
    db=db,
    extraction=extraction,
)

print(result)

db.close()