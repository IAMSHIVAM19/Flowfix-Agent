from uuid import uuid4
import pytest
from sqlalchemy import delete

from app.database import SessionLocal
from app.models import RequestStatus
from app.models_db import Customer, ServiceRequest
from app.services.request_service import (
    create_customer,
    create_service_request,
    get_customer_by_phone,
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


class TestCustomerDatabaseOperations:
    def test_create_and_retrieve_customer(self, db):
        phone = f"04{uuid4().int % 10**8:08d}"

        customer = create_customer(
            db=db,
            name="John Doe Test",
            phone=phone,
            address="42 Wallaby Way, Sydney",
        )

        try:
            assert customer.id is not None
            assert customer.name == "John Doe Test"
            assert customer.phone == phone
            assert customer.address == "42 Wallaby Way, Sydney"

            fetched = get_customer_by_phone(db=db, phone=phone)
            assert fetched is not None
            assert fetched.id == customer.id
            assert fetched.name == "John Doe Test"

        finally:
            db.execute(delete(Customer).where(Customer.id == customer.id))
            db.commit()

    def test_unknown_phone_returns_none(self, db):
        unknown = get_customer_by_phone(db=db, phone="00000000000")
        assert unknown is None

    def test_search_customers_by_name(self, db):
        from app.tools.customer_tools import get_customer, search_customers

        # Test search by name
        results = search_customers(db=db, query="Conrad Fisher")
        assert len(results) >= 1
        assert any("Conrad Fisher" in c["name"] for c in results)

        # Test get_customer with name parameter
        cust = get_customer(db=db, name="Chloe")
        assert cust is not None
        assert "Chloe" in cust["name"]

    def test_agent_customer_name_queries(self, db):
        from app.agent.flowfix_agent import FlowFixAgent

        agent = FlowFixAgent(db)

        # Test Conrad Fisher query
        res1 = agent.run_operation(message="is there a customer named conrad fisher?")
        assert res1.status == "completed"
        assert "Conrad Fisher" in res1.message
        assert len(res1.tool_calls) == 1
        assert res1.tool_calls[0].tool_name == "search_customers"

        # Test Chloe query
        res2 = agent.run_operation(message="is there a customer named chloe")
        assert res2.status == "completed"
        assert "Chloe" in res2.message
        assert len(res2.tool_calls) == 1
        assert res2.tool_calls[0].tool_name == "search_customers"
