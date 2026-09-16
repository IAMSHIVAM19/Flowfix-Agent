import pytest
from fastapi import HTTPException

from app.api.admin import run_agent_operation
from app.auth.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.database import SessionLocal
from app.models import AgentOperationRequest


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


class TestAuthSecurity:
    def test_password_hashing_and_verification(self):
        plain = "SuperSecretPassword123!"
        hashed = hash_password(plain)

        assert hashed != plain
        assert verify_password(plain, hashed) is True
        assert verify_password("WrongPassword!", hashed) is False

    def test_access_token_creation_and_decoding(self):
        username = "admin_test"
        token = create_access_token(subject=username)

        assert token is not None
        assert isinstance(token, str)

        decoded_user = decode_access_token(token)
        assert decoded_user == username

    def test_invalid_token_decoding(self):
        with pytest.raises(Exception):
            decode_access_token("invalid.token.payload")


class TestAdminAgentValidation:
    def test_empty_agent_message_rejected(self, db):
        req = AgentOperationRequest(message="   ")
        with pytest.raises(HTTPException) as exc_info:
            run_agent_operation(operation=req, db=db)
        assert exc_info.value.status_code == 400
        assert "cannot be empty" in exc_info.value.detail

    def test_nonexistent_request_id_rejected(self, db):
        req = AgentOperationRequest(
            request_id="non-existent-uuid-9999",
            message="Check status of this request",
        )
        with pytest.raises(HTTPException) as exc_info:
            run_agent_operation(operation=req, db=db)
        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail


class TestSPAReloadRouting:
    def test_browser_page_reload_serves_spa_html(self):
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        # Browser navigating or reloading sends text/html in Accept header
        res = client.get(
            "/requests",
            headers={"accept": "text/html,application/xhtml+xml", "sec-fetch-dest": "document"},
        )
        assert res.status_code == 200
        assert "text/html" in res.headers.get("content-type", "")

    def test_api_request_without_auth_returns_401(self):
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        # Direct API fetch request without credentials should fail with 401 Not authenticated
        res = client.get("/requests")
        assert res.status_code == 401
        assert res.json().get("detail") == "Not authenticated"
