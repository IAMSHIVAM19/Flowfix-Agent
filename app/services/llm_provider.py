import os
from datetime import date

from dotenv import load_dotenv

from ..models import RequestExtraction
from .llm_service import extract_request
from .mock_llm_service import (
    mock_extract_complete_request,
    mock_extract_incomplete_request,
    mock_extract_unsupported_service,
    mock_extract_test_date_request,
)


load_dotenv()


def get_extraction(
    message: str,
    current_date: date,
) -> RequestExtraction:
    provider = os.getenv("LLM_PROVIDER", "mock").lower()
    llm_enabled = os.getenv("LLM_ENABLED", "false").lower() == "true"

    # Safety default: do not make a real LLM call unless explicitly enabled.
    if not llm_enabled:
        scenario = os.getenv("MOCK_LLM_SCENARIO", "complete").lower()

        if scenario == "complete":
            return mock_extract_complete_request()

        if scenario == "incomplete":
            return mock_extract_incomplete_request()

        if scenario == "unsupported":
            return mock_extract_unsupported_service()

        if scenario == "test_date":
            return mock_extract_test_date_request()

        raise ValueError(
            f"Unsupported MOCK_LLM_SCENARIO: {scenario}"
        )

    if provider == "gemini":
        return extract_request(
            message=message,
            current_date=current_date.isoformat(),
        )

    raise ValueError(
        f"LLM is enabled but provider '{provider}' is unsupported"
    )