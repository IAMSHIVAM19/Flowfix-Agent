from .database import SessionLocal
from .services.llm_provider import get_extraction
from .services.scheduling_service import get_options_for_extraction

from datetime import date


db = SessionLocal()

extraction = get_extraction(
    message="My toilet is blocked.",
    current_date=date(2026, 8, 23),
)

options = get_options_for_extraction(
    db=db,
    extraction=extraction,
)

if not options:
    print("No appointment options currently available.")
else:
    for option in options:
        print(option)

db.close()