import os

from ollama import Client

from ..models import RequestExtraction
from ..prompts import build_request_extraction_prompt


OLLAMA_HOST = os.getenv(
    "OLLAMA_HOST",
    "http://127.0.0.1:11434",
)

OLLAMA_MODEL = os.getenv(
    "LLM_MODEL",
    "qwen2.5:3b",
).strip()


def get_ollama_client():
    return Client(
        host=OLLAMA_HOST,
        timeout=6.0,
    )



def extract_request(
    message: str,
    current_date: str,
) -> RequestExtraction:
    client = get_ollama_client()

    prompt = build_request_extraction_prompt(
        current_date
    )

    full_prompt = (
        f"{prompt}\n\n"
        f"Customer message:\n{message}"
    )

    try:
        response = client.chat(
            model=OLLAMA_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": full_prompt,
                }
            ],
            format="json",
        )

        content = response["message"]["content"]

        return RequestExtraction.model_validate_json(
            content
        )

    except Exception as exc:
        print(
            f"Ollama extraction failed: {exc}"
        )
        raise RuntimeError(
            "Ollama extraction failed"
        ) from exc