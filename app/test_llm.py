from .services.llm_service import extract_request


result = extract_request(
    message=(
        "My kitchen tap has been leaking since this morning. "
        "It's not urgent and I'd prefer Thursday afternoon."
    ),
    current_date="2026-08-22",
)

print(result)
print(result.model_dump())