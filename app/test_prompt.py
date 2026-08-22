from .prompts import build_request_extraction_prompt


prompt = build_request_extraction_prompt("2026-08-22")

print(prompt)