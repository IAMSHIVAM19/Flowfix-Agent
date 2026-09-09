import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from ..models import RequestExtraction
from ..prompts import build_request_extraction_prompt

load_dotenv()

DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"


def get_openrouter_client() -> OpenAI:
    if "OPENROUTER_API_KEY" not in os.environ:
        load_dotenv()
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()

    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

    base_url = os.getenv(
        "OPENROUTER_BASE_URL",
        DEFAULT_OPENROUTER_BASE_URL,
    ).strip()

    site_url = os.getenv(
        "OPENROUTER_SITE_URL",
        "http://localhost:5174",
    ).strip()

    app_name = os.getenv(
        "OPENROUTER_APP_NAME",
        "FlowFix AI",
    ).strip()

    return OpenAI(
        base_url=base_url,
        api_key=api_key,
        default_headers={
            "HTTP-Referer": site_url,
            "X-Title": app_name,
        },
        timeout=15.0,
    )


def extract_request(
    message: str,
    current_date: str,
) -> RequestExtraction:
    client = get_openrouter_client()

    model = os.getenv(
        "OPENROUTER_MODEL",
        DEFAULT_OPENROUTER_MODEL,
    ).strip()

    prompt = build_request_extraction_prompt(current_date)

    json_schema_prompt = (
        f"{prompt}\n\n"
        "RESPONSE FORMAT:\n"
        "You must respond with a JSON object strictly matching this schema:\n"
        "{\n"
        '  "issue": string | null,\n'
        '  "service": string | null,\n'
        '  "urgency": "low" | "normal" | "high" | null,\n'
        '  "preferred_date": "YYYY-MM-DD" | null,\n'
        '  "preferred_weekday": string | null,\n'
        '  "preferred_time": string | null,\n'
        '  "needs_follow_up": boolean,\n'
        '  "follow_up_question": string | null\n'
        "}\n"
        "Return ONLY the valid JSON object without surrounding prose or explanation."
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": json_schema_prompt,
                },
                {
                    "role": "user",
                    "content": f"Customer message:\n{message}",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        content = response.choices[0].message.content or ""
        cleaned = content.strip()

        # Strip markdown fences if returned
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        return RequestExtraction.model_validate_json(cleaned)

    except Exception as exc:
        print(f"OpenRouter extraction failed: {exc}")
        raise RuntimeError(f"OpenRouter extraction failed: {exc}") from exc
