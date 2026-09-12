import pytest
from app.services.pricing_service import calculate_quote_estimate, CALLOUT_FEE, HIGH_URGENCY_SURCHARGE


class TestPricingService:
    def test_standard_service_pricing(self):
        estimate = calculate_quote_estimate("tap repair", "normal")
        assert estimate["service_name"] == "tap repair"
        assert estimate["estimated_min"] == 120
        assert estimate["estimated_max"] == 180
        assert estimate["callout_fee"] == CALLOUT_FEE
        assert estimate["urgency_surcharge"] == 0
        assert estimate["currency"] == "AUD"
        assert "Standard Fixed Dispatch" in estimate["pricing_tier"]

    def test_emergency_burst_pipe_pricing(self):
        estimate = calculate_quote_estimate("burst pipe repair", "high")
        assert estimate["service_name"] == "burst pipe repair"
        assert estimate["estimated_min"] == 320 + HIGH_URGENCY_SURCHARGE
        assert estimate["estimated_max"] == 750 + HIGH_URGENCY_SURCHARGE
        assert estimate["callout_fee"] == CALLOUT_FEE
        assert estimate["urgency_surcharge"] == HIGH_URGENCY_SURCHARGE
        assert "Emergency Priority Dispatch" in estimate["pricing_tier"]

    def test_hot_water_pricing(self):
        estimate = calculate_quote_estimate("hot water system", "normal")
        assert estimate["service_name"] == "hot water system"
        assert estimate["estimated_min"] == 280
        assert estimate["estimated_max"] == 650

    def test_fallback_unrecognized_service(self):
        estimate = calculate_quote_estimate("custom fountain installation", "low")
        assert estimate["estimated_min"] == 150
        assert estimate["estimated_max"] == 260
        assert estimate["callout_fee"] == CALLOUT_FEE
        assert estimate["is_estimate"] is True
