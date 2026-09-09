import json
import os
from unittest.mock import MagicMock, patch

import pytest

from app.models import RequestExtraction
from app.services.llm_provider import get_extraction
from app.services.openrouter_service import (
    extract_request,
    get_openrouter_client,
)


def test_openrouter_missing_api_key_raises_runtime_error(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "")
    with pytest.raises(RuntimeError, match="OPENROUTER_API_KEY is not set"):
        get_openrouter_client()


def test_openrouter_extraction_mocked(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-v1-mock-key-12345")
    monkeypatch.setenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

    mock_json = json.dumps({
        "issue": "leaking kitchen mixer tap under the sink",
        "service": "tap repair",
        "urgency": "normal",
        "preferred_date": "2026-09-12",
        "preferred_weekday": "Saturday",
        "preferred_time": "morning",
        "needs_follow_up": False,
        "follow_up_question": None,
    })

    mock_choice = MagicMock()
    mock_choice.message.content = mock_json

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with patch("app.services.openrouter_service.get_openrouter_client", return_value=mock_client):
        result = extract_request(
            message="My kitchen mixer tap is dripping under the sink. I prefer this Saturday morning.",
            current_date="2026-09-09",
        )

    assert isinstance(result, RequestExtraction)
    assert result.issue == "leaking kitchen mixer tap under the sink"
    assert result.service == "tap repair"
    assert result.urgency == "normal"
    assert result.preferred_date == "2026-09-12"
    assert result.preferred_time == "morning"
    assert result.needs_follow_up is False


def test_openrouter_markdown_fence_cleaning(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "sk-or-v1-mock-key-12345")

    # LLMs frequently wrap JSON in markdown fences
    raw_fenced = (
        "```json\n"
        "{\n"
        '  "issue": "burst water main pipe flooding laundry",\n'
        '  "service": "burst pipe repair",\n'
        '  "urgency": "high",\n'
        '  "preferred_date": "2026-09-09",\n'
        '  "preferred_weekday": null,\n'
        '  "preferred_time": "emergency",\n'
        '  "needs_follow_up": false,\n'
        '  "follow_up_question": null\n'
        "}\n"
        "```"
    )

    mock_choice = MagicMock()
    mock_choice.message.content = raw_fenced

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = mock_completion

    with patch("app.services.openrouter_service.get_openrouter_client", return_value=mock_client):
        result = extract_request(
            message="Emergency! Water pipe burst in the laundry room, water everywhere!",
            current_date="2026-09-09",
        )

    assert isinstance(result, RequestExtraction)
    assert result.issue == "burst water main pipe flooding laundry"
    assert result.service == "burst pipe repair"
    assert result.urgency == "high"


def test_llm_provider_openrouter_fallback(monkeypatch):
    from datetime import date
    monkeypatch.setenv("LLM_ENABLED", "true")
    monkeypatch.setenv("LLM_PROVIDER", "openrouter")
    monkeypatch.setenv("OPENROUTER_API_KEY", "")

    # When key is unset or OpenRouter call fails, get_extraction must gracefully
    # fall back to deterministic extraction rather than crashing
    result = get_extraction(
        message="Burst pipe pouring water into bathroom, need urgent help right now!",
        current_date=date(2026, 9, 9),
    )

    assert result is not None
    assert isinstance(result, RequestExtraction)
    assert result.urgency == "high"
    assert result.service in ("burst pipe repair", "leak investigation")
    assert result.preferred_date == "2026-09-09"
