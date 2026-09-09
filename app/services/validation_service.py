import re
from datetime import date, datetime, time, timedelta

from ..models import RequestExtraction


def get_earliest_slot_for_flexible_time(
    current_date: date,
    now_time: time | None = None,
) -> tuple[str, str]:
    """
    Given the current time of day, calculate the earliest bookable (date, time_slot).
    - If before 09:00: today morning
    - If 09:00 <= now < 13:00: today afternoon
    - If >= 13:00: tomorrow morning
    """
    if now_time is None:
        now_time = datetime.now().time()

    if now_time < time(9, 0):
        return current_date.isoformat(), "morning"
    elif now_time < time(13, 0):
        return current_date.isoformat(), "afternoon"
    else:
        return (current_date + timedelta(days=1)).isoformat(), "morning"


WEEKDAY_FULL = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday",
}

WEEKDAY_NAMES = {
    "monday": 0, "mon": 0,
    "tuesday": 1, "tue": 1, "tues": 1,
    "wednesday": 2, "wed": 2,
    "thursday": 3, "thu": 3, "thur": 3, "thurs": 3,
    "friday": 4, "fri": 4,
    "saturday": 5, "sat": 5,
    "sunday": 6, "sun": 6,
}

MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}


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


def get_next_weekday_date(
    weekday_name: str | None,
    current_date: date,
) -> str | None:
    if not weekday_name:
        return None

    normalized = weekday_name.strip().lower()

    if normalized not in WEEKDAY_NAMES:
        return None

    target_weekday = WEEKDAY_NAMES[normalized]
    days_ahead = (
        target_weekday - current_date.weekday()
    ) % 7

    # If the requested weekday is today, schedule for today
    return (
        current_date + timedelta(days=days_ahead)
    ).isoformat()


def parse_natural_date_and_time(
    text: str | None,
    current_date: date,
    now_time: time | None = None,
) -> tuple[str | None, str | None, str | None]:
    """
    Deterministically extract (preferred_date, preferred_weekday, preferred_time)
    from free-text customer messages or follow-up answers.
    """
    if not text:
        return None, None, None

    normalized = text.strip().lower()
    extracted_date: str | None = None
    extracted_weekday: str | None = None
    extracted_time: str | None = None

    # 1. Date extraction
    # Check for direct ISO date (YYYY-MM-DD)
    iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", normalized)
    if iso_match:
        extracted_date = iso_match.group(1)

    # Check for day + month patterns e.g. "11 sep", "11th september", "sep 11"
    if extracted_date is None:
        # e.g. "11 sep", "11th september"
        dm_match = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|september|oct|nov|dec)[a-z]*\b", normalized)
        if dm_match:
            d_num = int(dm_match.group(1))
            m_str = dm_match.group(2)
            m_num = MONTH_MAP.get(m_str, 9)
            year = current_date.year
            try:
                candidate = date(year, m_num, d_num)
                if candidate < current_date:
                    candidate = date(year + 1, m_num, d_num)
                extracted_date = candidate.isoformat()
            except ValueError:
                pass

    if extracted_date is None:
        # e.g. "sep 11", "september 11th"
        md_match = re.search(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|september|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b", normalized)
        if md_match:
            m_str = md_match.group(1)
            d_num = int(md_match.group(2))
            m_num = MONTH_MAP.get(m_str, 9)
            year = current_date.year
            try:
                candidate = date(year, m_num, d_num)
                if candidate < current_date:
                    candidate = date(year + 1, m_num, d_num)
                extracted_date = candidate.isoformat()
            except ValueError:
                pass

    # Relative day keywords
    if extracted_date is None:
        if "day after tomorrow" in normalized:
            extracted_date = (current_date + timedelta(days=2)).isoformat()
        elif "tomorrow" in normalized:
            extracted_date = (current_date + timedelta(days=1)).isoformat()
        elif any(w in normalized for w in ["today", "right now", "immediately", "asap", "urgent"]):
            extracted_date = current_date.isoformat()

    # Weekday keywords (check both full names and abbreviations)
    for w_name, w_idx in WEEKDAY_NAMES.items():
        if re.search(rf"\b{w_name}\b", normalized):
            extracted_weekday = WEEKDAY_FULL[w_idx]
            if extracted_date is None:
                extracted_date = get_next_weekday_date(w_name, current_date)
            break

    # If extracted_date is found, ensure weekday matches it
    if extracted_date:
        try:
            parsed_d = date.fromisoformat(extracted_date)
            extracted_weekday = WEEKDAY_FULL[parsed_d.weekday()]
        except ValueError:
            pass

    # 2. Time extraction
    morning_keywords = ["morning", "am", "9am", "10am", "11am", "9:00", "10:00", "11:00", "early"]
    afternoon_keywords = ["afternoon", "evening", "pm", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "13:00", "14:00", "15:00", "16:00", "17:00", "late"]
    flexible_keywords = ["any time", "anytime", "whenever", "first available", "any slot", "either", "asap", "right now", "immediately", "now", "urgent"]

    for kw in morning_keywords:
        if re.search(rf"\b{kw}\b", normalized):
            extracted_time = "morning"
            break

    if extracted_time is None:
        for kw in afternoon_keywords:
            if re.search(rf"\b{kw}\b", normalized):
                extracted_time = "afternoon"
                break

    if extracted_time is None:
        for kw in flexible_keywords:
            if kw in normalized:
                extracted_time = "morning"
                break

    return extracted_date, extracted_weekday, extracted_time


def normalize_preferred_time(
    preferred_time: str | None,
) -> str | None:
    if preferred_time is None:
        return None

    norm = preferred_time.strip().lower()

    if norm in {"morning", "am", "9am", "10am", "11am", "9:00", "10:00", "11:00", "early"}:
        return "morning"

    if norm in {"afternoon", "evening", "pm", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "13:00", "14:00", "15:00", "16:00", "17:00", "late"}:
        return "afternoon"

    if norm in {"now", "immediately", "asap", "right now", "any time", "anytime", "whenever", "first available", "any slot", "urgent"}:
        return "morning"

    return preferred_time


def normalize_preferred_date(
    preferred_date: str | None,
    preferred_time: str | None,
    preferred_weekday: str | None,
    current_date: date,
) -> str | None:
    if preferred_date is not None:
        norm_date = preferred_date.strip().lower()
        if norm_date == "today":
            return current_date.isoformat()
        if norm_date == "tomorrow":
            return (current_date + timedelta(days=1)).isoformat()
        if norm_date == "day after tomorrow":
            return (current_date + timedelta(days=2)).isoformat()
        if norm_date in WEEKDAY_NAMES:
            return get_next_weekday_date(norm_date, current_date)
        try:
            date.fromisoformat(norm_date)
            return norm_date
        except ValueError:
            parsed_d, _, _ = parse_natural_date_and_time(norm_date, current_date)
            if parsed_d:
                return parsed_d
            return preferred_date

    time_lower = (preferred_time or "").strip().lower()

    if time_lower in {
        "now",
        "immediately",
        "asap",
        "right now",
        "today",
        "urgent",
    }:
        return current_date.isoformat()

    if time_lower == "tomorrow":
        return (current_date + timedelta(days=1)).isoformat()

    if preferred_weekday:
        return get_next_weekday_date(
            weekday_name=preferred_weekday,
            current_date=current_date,
        )

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
        preferred_weekday=extraction.preferred_weekday,
        current_date=current_date,
    )

    if normalized_date is None:
        missing.append("preferred_date")

    if extraction.preferred_time is None:
        missing.append("preferred_time")

    return missing


def build_clarification_message(
    missing_fields: list[str],
) -> str:
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
        question_text = (
            f"{questions[0]} and {questions[1]}"
        )
    else:
        question_text = (
            ", ".join(questions[:-1])
            + f", and {questions[-1]}"
        )

    return (
        "Before we continue, I need a little more "
        f"information: {question_text}."
    )


def needs_clarification(
    extraction: RequestExtraction,
    current_date: date,
) -> bool:
    return bool(
        get_missing_fields(
            extraction,
            current_date,
        )
    )


def date_matches_weekday(
    preferred_date: str | None,
    preferred_weekday: str | None,
) -> bool:
    if (
        preferred_date is None
        or preferred_weekday is None
    ):
        return True

    try:
        parsed_date = date.fromisoformat(
            preferred_date
        )
    except ValueError:
        return False

    w_lower = preferred_weekday.strip().lower()
    if w_lower not in WEEKDAY_NAMES:
        return True

    target_weekday = WEEKDAY_NAMES[w_lower]
    return parsed_date.weekday() == target_weekday


def normalize_extraction_date(
    extraction: RequestExtraction,
    current_date: date,
) -> RequestExtraction:
    # 1. Normalize date
    normalized_date = normalize_preferred_date(
        preferred_date=extraction.preferred_date,
        preferred_time=extraction.preferred_time,
        preferred_weekday=extraction.preferred_weekday,
        current_date=current_date,
    )

    if normalized_date is not None:
        extraction.preferred_date = normalized_date
        try:
            parsed_d = date.fromisoformat(normalized_date)
            extraction.preferred_weekday = WEEKDAY_FULL[parsed_d.weekday()]
        except ValueError:
            pass

    # 2. Normalize time slot
    if extraction.preferred_time is not None:
        norm_time = normalize_preferred_time(
            extraction.preferred_time
        )
        if norm_time:
            extraction.preferred_time = norm_time

    return extraction