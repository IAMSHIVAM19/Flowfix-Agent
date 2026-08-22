from datetime import date

from .models import RequestExtraction
from .services.validation_service import (
    get_missing_fields,
    needs_clarification,
)
from .services.validation_service import date_matches_weekday

today = date(2026, 8, 22)

right_now_request = RequestExtraction(
    issue="ceiling leak",
    urgency="high",
    preferred_date=None,
    preferred_time="now",
)

incomplete_request = RequestExtraction(
    issue="leaking bathroom tap",
    urgency=None,
    preferred_date=None,
    preferred_time=None,
)

print(get_missing_fields(right_now_request, today))
print(needs_clarification(right_now_request, today))

print(get_missing_fields(incomplete_request, today))
print(needs_clarification(incomplete_request, today))

print(date_matches_weekday("2026-08-27", "Thursday"))
print(date_matches_weekday("2026-08-28", "Thursday"))
print(date_matches_weekday(None, "Thursday"))
print(date_matches_weekday("2026-08-27", None))