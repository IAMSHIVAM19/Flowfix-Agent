from .models import RequestExtraction
from .services.extraction_service import process_extraction


complete_request = RequestExtraction(
    issue="leaking kitchen tap",
    urgency="normal",
    preferred_date="2026-08-27",
    preferred_time="afternoon",
)

incomplete_request = RequestExtraction(
    issue="leaking bathroom tap",
    urgency=None,
    preferred_date=None,
    preferred_time=None,
)

print(process_extraction(complete_request))
print(process_extraction(incomplete_request))