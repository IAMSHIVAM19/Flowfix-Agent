from sqlalchemy.orm import Session

from ..models import SchedulingResult, RequestExtraction
from .scheduling_service import get_options_for_extraction


def process_scheduling(
    db: Session,
    extraction: RequestExtraction,
) -> SchedulingResult:
    options = get_options_for_extraction(
        db=db,
        extraction=extraction,
    )

    if not options:
        return SchedulingResult(
            status="no_availability",
            message=(
                "We couldn't find an available technician for "
                "your requested service and time."
            ),
            extraction=extraction,
            appointment_options=[],
        )

    return SchedulingResult(
        status="options_available",
        message="We found available appointment options.",
        extraction=extraction,
        appointment_options=options,
    )