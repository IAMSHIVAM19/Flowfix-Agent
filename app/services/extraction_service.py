from datetime import date

from sqlalchemy.orm import Session

from ..models import ExtractionResult, RequestExtraction
from .service_validation import (
    get_service_by_name,
    normalize_service_name,
)
from .validation_service import (
    build_clarification_message,
    date_matches_weekday,
    get_missing_fields,
    normalize_extraction_date,
)


def process_extraction(
    extraction: RequestExtraction,
    db: Session,
) -> ExtractionResult:
    # ------------------------------------------------------------
    # Normalize deterministic service information first.
    #
    # This must happen BEFORE checking needs_follow_up so that
    # obvious services such as "tap leaking" are still converted
    # to their canonical FlowFix service even when the LLM also
    # asks a follow-up question.
    # ------------------------------------------------------------

    if extraction.service is not None:
        extraction.service = normalize_service_name(
            extraction.service
        )
    else:
        extraction.service = normalize_service_name(
            extraction.issue
        )

    # ------------------------------------------------------------
    # Normalize relative weekday/date information.
    # ------------------------------------------------------------

    extraction = normalize_extraction_date(
        extraction=extraction,
        current_date=date.today(),
    )

    # ------------------------------------------------------------
    # AI-generated follow-up question
    # ------------------------------------------------------------

    if extraction.needs_follow_up:
        question = (
            extraction.follow_up_question
            or (
                "Could you provide a little more information "
                "about the problem?"
            )
        )

        return ExtractionResult(
            status="needs_follow_up",
            message=question,
            extraction=extraction,
        )

    # ------------------------------------------------------------
    # Required-field validation
    # ------------------------------------------------------------

    missing_fields = get_missing_fields(
        extraction=extraction,
        current_date=date.today(),
    )

    if missing_fields:
        return ExtractionResult(
            status="needs_clarification",
            message=build_clarification_message(
                missing_fields
            ),
            extraction=extraction,
        )

    # ------------------------------------------------------------
    # Date / weekday validation
    # ------------------------------------------------------------

    if not date_matches_weekday(
        extraction.preferred_date,
        extraction.preferred_weekday,
    ):
        return ExtractionResult(
            status="needs_clarification",
            message=(
                "The requested day and date do not appear to "
                "match. Please confirm your preferred date."
            ),
            extraction=extraction,
        )

    # ------------------------------------------------------------
    # Service validation
    # ------------------------------------------------------------

    service = get_service_by_name(
        db,
        extraction.service,
    )

    if service is None:
        return ExtractionResult(
            status="needs_clarification",
            message=(
                "I couldn't match the requested plumbing service "
                "to a FlowFix service. Please provide a little "
                "more detail about the problem."
            ),
            extraction=extraction,
        )

    # ------------------------------------------------------------
    # Ready
    # ------------------------------------------------------------

    return ExtractionResult(
        status="ready",
        message="Request contains all required information.",
        extraction=extraction,
    )