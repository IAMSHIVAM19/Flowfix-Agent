from datetime import date

from ..models import RequestExtraction


def validate_preferred_date(
    preferred_date: str | None,
    current_date: date | None = None,
) -> bool:
    if preferred_date is None:
        return True

    try:
        parsed_date = date.fromisoformat(preferred_date)
    except ValueError:
        return False

    if current_date is not None and parsed_date < current_date:
        return False

    return True


def normalize_preferred_date(
    preferred_date: str | None,
    preferred_time: str | None,
    current_date: date,
) -> str | None:
    if preferred_date is not None:
        return preferred_date

    if preferred_time in {"now", "immediately", "asap", "right now"}:
        return current_date.isoformat()

    return None


def get_missing_fields(
    extraction: RequestExtraction,
    current_date: date,
) -> list[str]:
    missing = []

    if not extraction.issue:
        missing.append("issue")

    if extraction.urgency is None:
        missing.append("urgency")

    normalized_date = normalize_preferred_date(
        preferred_date=extraction.preferred_date,
        preferred_time=extraction.preferred_time,
        current_date=current_date,
    )

    if normalized_date is None:
        missing.append("preferred_date")

    if extraction.preferred_time is None:
        missing.append("preferred_time")

    return missing

def build_clarification_message(missing_fields: list[str]) -> str:
    questions = []

    if "urgency" in missing_fields:
        questions.append("whether the issue is urgent")

    if "preferred_date" in missing_fields:
        questions.append("your preferred date")

    if "preferred_time" in missing_fields:
        questions.append("your preferred time")

    if not questions:
        return ""

    if len(questions) == 1:
        question_text = questions[0]
    elif len(questions) == 2:
        question_text = f"{questions[0]} and {questions[1]}"
    else:
        question_text = ", ".join(questions[:-1]) + f", and {questions[-1]}"

    return (
        f"Before we continue, I need a little more information: "
        f"{question_text}."
    )


def needs_clarification(
    extraction: RequestExtraction,
    current_date: date,
) -> bool:
    return bool(get_missing_fields(extraction, current_date))

def date_matches_weekday(
    preferred_date: str | None,
    preferred_weekday: str | None,
) -> bool:
    if preferred_date is None or preferred_weekday is None:
        return True

    try:
        parsed_date = date.fromisoformat(preferred_date)
    except ValueError:
        return False

    return parsed_date.strftime("%A").lower() == preferred_weekday.strip().lower()