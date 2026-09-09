import os
import pytest

from app.services.llm_service import extract_request


def test_llm_extraction():
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY is not set")

    try:
        result = extract_request(
            message=(
                "My kitchen tap has been leaking since this morning. "
                "It's not urgent and I'd prefer Thursday afternoon."
            ),
            current_date="2026-08-22",
        )
    except RuntimeError as exc:
        pytest.skip(
            f"Live LLM service unavailable: {exc}"
        )

    assert result is not None
    assert result.issue
    assert result.service
    assert result.urgency
