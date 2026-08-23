from ..models import RequestExtraction


def mock_extract_complete_request() -> RequestExtraction:
    return RequestExtraction(
        issue="leaking kitchen tap",
        service="tap repair",
        urgency="normal",
        preferred_date="2026-08-27",
        preferred_weekday="Thursday",
        preferred_time="afternoon",
    )


def mock_extract_incomplete_request() -> RequestExtraction:
    return RequestExtraction(
        issue="leaking bathroom tap",
        service=None,
        urgency=None,
        preferred_date=None,
        preferred_weekday=None,
        preferred_time=None,
    )


def mock_extract_unsupported_service() -> RequestExtraction:
    return RequestExtraction(
        issue="special plumbing problem",
        service="special plumbing service",
        urgency="normal",
        preferred_date="2026-08-27",
        preferred_weekday="Thursday",
        preferred_time="afternoon",
    )


def mock_extract_service_alias() -> RequestExtraction:
    return RequestExtraction(
        issue="leaking kitchen tap",
        service="Faucet Repair",
        urgency="normal",
        preferred_date="2026-08-27",
        preferred_weekday="Thursday",
        preferred_time="afternoon",
    )


def mock_extract_inconsistent_date() -> RequestExtraction:
    return RequestExtraction(
        issue="leaking kitchen tap",
        service="tap repair",
        urgency="normal",
        preferred_date="2026-08-28",
        preferred_weekday="Thursday",
        preferred_time="afternoon",
    )

def mock_extract_test_date_request() -> RequestExtraction:
    return RequestExtraction(
        issue="leaking kitchen tap",
        service="tap repair",
        urgency="normal",
        preferred_date="2026-08-28",
        preferred_weekday="Friday",
        preferred_time="afternoon",
    )