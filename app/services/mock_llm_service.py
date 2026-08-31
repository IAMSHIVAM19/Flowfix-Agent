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

def mock_extract_toilet_request() -> RequestExtraction:
    return RequestExtraction(
        issue="blocked toilet",
        service="toilet repair",
        urgency="normal",
        preferred_date="2026-08-27",
        preferred_weekday="Thursday",
        preferred_time="afternoon",
    )

def mock_extract_follow_up_toilet() -> RequestExtraction:
    return RequestExtraction(
        issue="leaking toilet",
        service="toilet repair",
        urgency="normal",
        preferred_date=None,
        preferred_weekday=None,
        preferred_time=None,
        needs_follow_up=True,
        follow_up_question=(
            "Is the toilet continuously leaking, "
            "and is it still usable?"
        ),
    )

def mock_extract_follow_up_toilet_answered() -> RequestExtraction:
    return RequestExtraction(
        issue="leaking toilet",
        service="toilet repair",
        urgency="normal",
        preferred_date="2026-08-28",
        preferred_weekday="Friday",
        preferred_time="afternoon",
        needs_follow_up=False,
        follow_up_question=None,
    )

def mock_extract_high_urgency_request() -> RequestExtraction:
    return RequestExtraction(
        issue="major kitchen leak",
        service="leak investigation",
        urgency="high",
        preferred_date="2026-08-28",
        preferred_weekday="Friday",
        preferred_time="morning",
        needs_follow_up=False,
        follow_up_question=None,
    )