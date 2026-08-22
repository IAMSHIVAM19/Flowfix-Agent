from sqlalchemy import select

from ..models_db import Service


SERVICE_ALIASES = {
    "faucet repair": "tap repair",
    "leaking tap repair": "tap repair",
    "tap/faucet repair": "tap repair",
    "toilet fix": "toilet repair",
    "shower fix": "shower repair",
    "leak repair": "leak investigation",
    "plumbing": None,
}


def normalize_service_name(service_name: str | None) -> str | None:
    if service_name is None:
        return None

    normalized = service_name.strip().lower()

    if normalized in SERVICE_ALIASES:
        return SERVICE_ALIASES[normalized]

    return normalized


def get_service_by_name(db, service_name: str | None):
    normalized_name = normalize_service_name(service_name)

    if normalized_name is None:
        return None

    statement = select(Service).where(Service.name == normalized_name)

    return db.scalar(statement)