import os
from datetime import date, datetime, time
from zoneinfo import ZoneInfo

# FlowFix operating timezone is Australia/Sydney by default (AEST/AEDT)
DEFAULT_TIMEZONE_NAME = os.getenv("FLOWFIX_TIMEZONE", "Australia/Sydney")


def get_flowfix_timezone(tz_name: str | None = None) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name or DEFAULT_TIMEZONE_NAME)
    except Exception:
        return ZoneInfo("Australia/Sydney")


def get_current_datetime(tz_name: str | None = None) -> datetime:
    tz = get_flowfix_timezone(tz_name)
    return datetime.now(tz)


def get_current_date(tz_name: str | None = None) -> date:
    return get_current_datetime(tz_name).date()


def get_current_time(tz_name: str | None = None) -> time:
    return get_current_datetime(tz_name).time()
