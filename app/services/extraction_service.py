from datetime import date

from sqlalchemy.orm import Session

from ..models import ExtractionResult, RequestExtraction
from .service_validation import get_service_by_name
from .validation_service import (
    build_clarification_message,
    date_matches_weekday,
    get_missing_fields,
)


def process_extraction(
    extraction: RequestExtraction,
    db: Session,
) -> ExtractionResult:
    # ------------------------------------------------------------
    # AI-generated follow-up question
    # ------------------------------------------------------------
    #
    # If the extraction model explicitly says that more information
    # is needed, use the AI-generated question first.
    #
    # This takes priority over the older generic missing-field
    # clarification so the customer gets a useful question about
    # their actual plumbing problem.
    #
    if extraction.needs_follow_up:
        question = (
            extraction.follow_up_question
            or "Could you provide a little more information about the problem?"
        )

        return ExtractionResult(
            status="needs_follow_up",
            message=question,
            extraction=extraction,
        )

    # ------------------------------------------------------------
    # Existing required-field validation
    # ------------------------------------------------------------

    missing_fields = get_missing_fields(
        extraction,
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
    # Existing date / weekday validation
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
    # Existing service validation
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