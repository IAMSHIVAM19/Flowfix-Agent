from .database import SessionLocal
from .services.mock_llm_service import mock_extract_complete_request
from .services.scheduling_service import get_options_for_extraction


db = SessionLocal()

extraction = mock_extract_complete_request()

options = get_options_for_extraction(
    db=db,
    extraction=extraction,
)

for option in options:
    print(option)

db.close()