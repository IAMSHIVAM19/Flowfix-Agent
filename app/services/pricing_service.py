"""
Pricing and Quote Estimation Service for FlowFix AI.
Calculates upfront, transparent estimates for certified plumbing trades.
"""

from typing import Any


TRADE_PRICING_TABLE = {
    "tap repair": {
        "base_min": 120,
        "base_max": 180,
        "typical_duration_hours": 1.5,
        "complexity": "Standard",
        "description": "Washer/cartridge replacement, spindle service, or mixer tap overhaul",
    },
    "toilet repair": {
        "base_min": 140,
        "base_max": 220,
        "typical_duration_hours": 1.5,
        "complexity": "Standard",
        "description": "Inlet/outlet valve rebuild, seal replacement, or cistern restoration",
    },
    "shower repair": {
        "base_min": 150,
        "base_max": 240,
        "typical_duration_hours": 2.0,
        "complexity": "Standard",
        "description": "Breach pipe check, showerhead/valve reseating, and waterproofing seal",
    },
    "leak investigation": {
        "base_min": 180,
        "base_max": 320,
        "typical_duration_hours": 2.0,
        "complexity": "Intermediate",
        "description": "Acoustic line leak diagnosis, thermal imaging, and pressure drop isolation",
    },
    "blocked drains": {
        "base_min": 190,
        "base_max": 350,
        "typical_duration_hours": 2.0,
        "complexity": "Intermediate",
        "description": "High-pressure water jetting, CCTV drain inspection, and obstruction clearing",
    },
    "hot water system": {
        "base_min": 280,
        "base_max": 650,
        "typical_duration_hours": 3.0,
        "complexity": "Advanced",
        "description": "Element/thermostat diagnostic, relief valve replacement, or gas pilot check",
    },
    "burst pipe repair": {
        "base_min": 320,
        "base_max": 750,
        "typical_duration_hours": 3.0,
        "complexity": "Critical / Emergency",
        "description": "Main water isolation, section cut-out, high-pressure coupling, and line test",
    },
    "gas fitting": {
        "base_min": 220,
        "base_max": 480,
        "typical_duration_hours": 2.5,
        "complexity": "Specialist",
        "description": "Licensed gas pressure drop testing, appliance regulator service, and safety cert",
    },
    "roof plumbing": {
        "base_min": 250,
        "base_max": 550,
        "typical_duration_hours": 3.0,
        "complexity": "Specialist",
        "description": "Guttering/downpipe flashing repair, roof penetration seal, and flow remediation",
    },
    "backflow prevention": {
        "base_min": 200,
        "base_max": 420,
        "typical_duration_hours": 2.0,
        "complexity": "Certified Specialist",
        "description": "Annual containment test, testable check valve rebuild, and water authority lodgement",
    },
}

CALLOUT_FEE = 89
HIGH_URGENCY_SURCHARGE = 80


def calculate_quote_estimate(
    service_name: str | None,
    urgency: str | None = None,
) -> dict[str, Any]:
    """
    Calculate an upfront transparent estimate based on plumbing category and urgency.
    """
    normalized_service = (service_name or "").strip().lower()
    normalized_urgency = (urgency or "").strip().lower()

    pricing_info = TRADE_PRICING_TABLE.get(normalized_service)

    if pricing_info is None:
        # Fallback general plumbing inspection
        base_min = 150
        base_max = 260
        complexity = "Standard"
        description = "On-site diagnostic inspection, pressure test, and standard parts remediation"
        matched_service = service_name or "general plumbing"
    else:
        base_min = pricing_info["base_min"]
        base_max = pricing_info["base_max"]
        complexity = pricing_info["complexity"]
        description = pricing_info["description"]
        matched_service = normalized_service

    is_emergency = normalized_urgency in {"high", "critical", "emergency"}
    urgency_surcharge = HIGH_URGENCY_SURCHARGE if is_emergency else 0

    estimated_min = base_min + urgency_surcharge
    estimated_max = base_max + urgency_surcharge

    tier = "Emergency Priority Dispatch" if is_emergency else "Standard Fixed Dispatch"

    summary = (
        f"${estimated_min} – ${estimated_max} AUD "
        f"(includes ${CALLOUT_FEE} diagnostic call-out fee & labor)"
    )

    return {
        "service_name": matched_service,
        "urgency": normalized_urgency or "normal",
        "pricing_tier": tier,
        "callout_fee": CALLOUT_FEE,
        "urgency_surcharge": urgency_surcharge,
        "estimated_min": estimated_min,
        "estimated_max": estimated_max,
        "currency": "AUD",
        "complexity": complexity,
        "description": description,
        "summary": summary,
        "is_estimate": True,
    }
