import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from ..models import RequestExtraction
from ..prompts import build_request_extraction_prompt


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set")

client = genai.Client(api_key=api_key)


def extract_request(message: str, current_date: str) -> RequestExtraction:
    prompt = build_request_extraction_prompt(current_date)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"{prompt}\n\nCustomer message:\n{message}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RequestExtraction,
            ),
        )

        return RequestExtraction.model_validate_json(response.text)

    except Exception as exc:
        raise RuntimeError("LLM extraction failed") from exc