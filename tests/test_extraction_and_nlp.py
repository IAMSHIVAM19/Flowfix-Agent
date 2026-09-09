from datetime import date, timedelta
import pytest

from app.models import RequestExtraction, RequestUrgency
from app.services.service_validation import normalize_service_name
from app.services.validation_service import (
    date_matches_weekday,
    get_missing_fields,
    normalize_preferred_date,
    normalize_preferred_time,
    parse_natural_date_and_time,
)


class TestServiceValidation:
    def test_tap_and_sink_aliases(self):
        assert normalize_service_name("tap repair") == "tap repair"
        assert normalize_service_name("leaking kitchen tap") == "tap repair"
        assert normalize_service_name("blocked sink") == "tap repair"
        assert normalize_service_name("kitchen sink") == "tap repair"
        assert normalize_service_name("bathroom basin") == "tap repair"
        assert normalize_service_name("dripping faucet") == "tap repair"

    def test_toilet_aliases(self):
        assert normalize_service_name("toilet repair") == "toilet repair"
        assert normalize_service_name("clogged toilet") == "toilet repair"
        assert normalize_service_name("broken toilet") == "toilet repair"

    def test_shower_aliases(self):
        assert normalize_service_name("shower repair") == "shower repair"
        assert normalize_service_name("leaking shower") == "shower repair"
        assert normalize_service_name("shower drain") == "shower repair"

    def test_leak_and_pipe_aliases(self):
        assert normalize_service_name("leak investigation") == "leak investigation"
        assert normalize_service_name("ceiling leak") == "leak investigation"
        assert normalize_service_name("unexplained water leak") == "leak investigation"
        assert normalize_service_name("severe leak") == "leak investigation"

    def test_real_world_plumbing_trade_services(self):
        # Blocked drains
        assert normalize_service_name("blocked drains") == "blocked drains"
        assert normalize_service_name("blocked drain") == "blocked drains"
        assert normalize_service_name("clogged drain") == "blocked drains"
        assert normalize_service_name("drain clearing") == "blocked drains"
        assert normalize_service_name("hydro jetting") == "blocked drains"
        assert normalize_service_name("sewer blockage") == "blocked drains"

        # Hot water system
        assert normalize_service_name("hot water system") == "hot water system"
        assert normalize_service_name("no hot water") == "hot water system"
        assert normalize_service_name("water heater leak") == "hot water system"
        assert normalize_service_name("hot water cylinder") == "hot water system"
        assert normalize_service_name("gas hot water") == "hot water system"

        # Burst pipe repair
        assert normalize_service_name("burst pipe") == "burst pipe repair"
        assert normalize_service_name("pipe burst") == "burst pipe repair"
        assert normalize_service_name("broken pipe") == "burst pipe repair"
        assert normalize_service_name("water main burst") == "burst pipe repair"

        # Gas fitting
        assert normalize_service_name("gas fitting") == "gas fitting"
        assert normalize_service_name("gas leak") == "gas fitting"
        assert normalize_service_name("smell gas") == "gas fitting"
        assert normalize_service_name("gas cooktop") == "gas fitting"
        assert normalize_service_name("gas heater") == "gas fitting"

        # Roof plumbing
        assert normalize_service_name("roof plumbing") == "roof plumbing"
        assert normalize_service_name("roof leak") == "roof plumbing"
        assert normalize_service_name("gutter repair") == "roof plumbing"
        assert normalize_service_name("downpipe") == "roof plumbing"

        # Backflow prevention
        assert normalize_service_name("backflow prevention") == "backflow prevention"
        assert normalize_service_name("backflow test") == "backflow prevention"
        assert normalize_service_name("rpz valve") == "backflow prevention"
        assert normalize_service_name("annual backflow") == "backflow prevention"

    def test_ambiguous_or_unsupported(self):
        assert normalize_service_name("plumbing") is None
        assert normalize_service_name(None) is None


class TestNaturalDateAndTimeParsing:
    @pytest.fixture
    def ref_date(self):
        # 2026-09-08 is a Tuesday
        return date(2026, 9, 8)

    def test_relative_dates(self, ref_date):
        d, w, t = parse_natural_date_and_time("tomorrow morning", ref_date)
        assert d == (ref_date + timedelta(days=1)).isoformat()
        assert t == "morning"

        d2, w2, t2 = parse_natural_date_and_time("day after tomorrow afternoon", ref_date)
        assert d2 == (ref_date + timedelta(days=2)).isoformat()
        assert t2 == "afternoon"

        d3, w3, t3 = parse_natural_date_and_time("asap right now", ref_date)
        assert d3 == ref_date.isoformat()
        assert t3 == "morning"

    def test_weekday_parsing(self, ref_date):
        d, w, t = parse_natural_date_and_time("Friday afternoon", ref_date)
        assert w == "Friday"
        assert t == "afternoon"
        # From Tuesday Sep 8, upcoming Friday is Sep 11
        assert d == "2026-09-11"

    def test_calendar_date_and_month(self, ref_date):
        d, w, t = parse_natural_date_and_time("11 Sept morning", ref_date)
        assert d == "2026-09-11"
        assert w == "Friday"
        assert t == "morning"

        d2, w2, t2 = parse_natural_date_and_time("September 15th afternoon", ref_date)
        assert d2 == "2026-09-15"
        assert t2 == "afternoon"

    def test_flexible_time_keywords(self, ref_date):
        _, _, t1 = parse_natural_date_and_time("any time works", ref_date)
        assert t1 == "morning"

        _, _, t2 = parse_natural_date_and_time("first available slot", ref_date)
        assert t2 == "morning"


class TestValidationAndClarification:
    @pytest.fixture
    def today(self):
        return date(2026, 9, 8)

    def test_complete_request_has_no_missing_fields(self, today):
        ext = RequestExtraction(
            issue="dripping tap in kitchen",
            service="tap repair",
            urgency=RequestUrgency.NORMAL,
            preferred_date="2026-09-10",
            preferred_time="morning",
        )
        missing = get_missing_fields(ext, today)
        assert len(missing) == 0

    def test_missing_fields_detected(self, today):
        ext = RequestExtraction(
            issue="water leak under floor",
            service="leak investigation",
            urgency=None,
            preferred_date=None,
            preferred_time=None,
        )
        missing = get_missing_fields(ext, today)
        assert "urgency" in missing
        assert "preferred_date" in missing
        assert "preferred_time" in missing

    def test_date_matches_weekday(self):
        # 2026-09-11 is a Friday
        assert date_matches_weekday("2026-09-11", "Friday") is True
        assert date_matches_weekday("2026-09-11", "Fri") is True
        assert date_matches_weekday("2026-09-11", "fri") is True
        assert date_matches_weekday("2026-09-11", "Monday") is False
        assert date_matches_weekday(None, "Friday") is True
