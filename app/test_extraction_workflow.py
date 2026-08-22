from .database import SessionLocal

from .services.extraction_service import process_extraction

from .services.mock_llm_service import (
    mock_extract_complete_request,
    mock_extract_incomplete_request,
    mock_extract_unsupported_service,
    mock_extract_service_alias,
    mock_extract_inconsistent_date,
)


db = SessionLocal()

complete = mock_extract_complete_request()
incomplete = mock_extract_incomplete_request()
unsupported = mock_extract_unsupported_service()
alias = mock_extract_service_alias()
inconsistent_date = mock_extract_inconsistent_date()

print(process_extraction(complete, db))
print(process_extraction(incomplete, db))
print(process_extraction(unsupported, db))
print(process_extraction(alias, db))
print(process_extraction(inconsistent_date, db))

db.close()