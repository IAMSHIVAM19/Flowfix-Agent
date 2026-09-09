import os
from datetime import date

from dotenv import load_dotenv

from ..models import RequestExtraction
from .llm_service import extract_request as extract_with_gemini
from .mock_llm_service import (
    mock_extract_complete_request,
    mock_extract_incomplete_request,
    mock_extract_unsupported_service,
    mock_extract_test_date_request,
    mock_extract_toilet_request,
    mock_extract_follow_up_toilet,
    mock_extract_follow_up_toilet_answered,
    mock_extract_high_urgency_request,
)
from .ollama_service import extract_request as extract_with_ollama
from .openrouter_service import extract_request as extract_with_openrouter
from .service_validation import normalize_service_name
from .validation_service import parse_natural_date_and_time


def deterministic_extract(
    message: str,
    current_date: date,
) -> RequestExtraction:
    """
    Fast, reliable extraction fallback used when the LLM provider
    is offline, unreachable, or fails to respond.
    """
    parsed_date, parsed_weekday, parsed_time = parse_natural_date_and_time(
        message,
        current_date=current_date,
    )

    service = normalize_service_name(message)

    low_message = message.lower()
    if any(w in low_message for w in ["burst", "flood", "urgent", "emergency", "immediately", "right now", "severe", "major", "pouring", "gushing"]):
        urgency = "high"
    elif any(w in low_message for w in ["minor", "not urgent", "small", "whenever", "can wait", "low priority"]):
        urgency = "low"
    else:
        urgency = "normal"

    cleaned_issue = message.strip()
    if "Original customer request:\n" in message:
        parts = message.split("Previous FlowFix question:\n")
        cleaned_issue = parts[0].replace("Original customer request:\n", "").strip()

    return RequestExtraction(
        issue=cleaned_issue,
        service=service,
        urgency=urgency,
        preferred_date=parsed_date,
        preferred_weekday=parsed_weekday,
        preferred_time=parsed_time,
        needs_follow_up=False,
        follow_up_question=None,
    )


load_dotenv()


def get_extraction(
    message: str,
    current_date: date,
) -> RequestExtraction:
    provider = os.getenv(
        "LLM_PROVIDER",
        "mock",
    ).strip().lower()

    llm_enabled = (
        os.getenv(
            "LLM_ENABLED",
            "false",
        ).strip().lower()
        == "true"
    )

    # --------------------------------------------------------
    # Safe default: use the deterministic mock provider.
    # --------------------------------------------------------

    if not llm_enabled:
        scenario = os.getenv(
            "MOCK_LLM_SCENARIO",
            "complete",
        ).strip().lower()

        if scenario == "complete":
            return mock_extract_complete_request()

        if scenario == "incomplete":
            return mock_extract_incomplete_request()

        if scenario == "unsupported":
            return mock_extract_unsupported_service()

        if scenario == "test_date":
            return mock_extract_test_date_request()

        if scenario == "high_urgency":
            return mock_extract_high_urgency_request()

        if scenario == "toilet":
            return mock_extract_toilet_request()

        if scenario == "follow_up_toilet":
            return mock_extract_follow_up_toilet()

        if scenario == "follow_up_toilet_answered":
            return mock_extract_follow_up_toilet_answered()

        raise ValueError(
            f"Unsupported MOCK_LLM_SCENARIO: {scenario}"
        )

    # --------------------------------------------------------
    # Ollama provider with deterministic fallback
    # --------------------------------------------------------

    if provider == "ollama":
        try:
            return extract_with_ollama(
                message=message,
                current_date=current_date.isoformat(),
            )
        except Exception as exc:
            print(
                f"Notice: Ollama extraction failed ({exc}). Falling back to deterministic extraction."
            )
            return deterministic_extract(message, current_date)

    # --------------------------------------------------------
    # Gemini provider with deterministic fallback
    # --------------------------------------------------------

    if provider == "gemini":
        try:
            return extract_with_gemini(
                message=message,
                current_date=current_date.isoformat(),
            )
        except Exception as exc:
            print(
                f"Notice: Gemini extraction failed ({exc}). Falling back to deterministic extraction."
            )
            return deterministic_extract(message, current_date)

    # --------------------------------------------------------
    # OpenRouter provider with deterministic fallback
    # --------------------------------------------------------

    if provider == "openrouter":
        try:
            return extract_with_openrouter(
                message=message,
                current_date=current_date.isoformat(),
            )
        except Exception as exc:
            print(
                f"Notice: OpenRouter extraction failed ({exc}). Falling back to deterministic extraction."
            )
            return deterministic_extract(message, current_date)

    raise ValueError(
        f"LLM is enabled but provider "
        f"'{provider}' is unsupported"
    )