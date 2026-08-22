from sqlalchemy import Enum as SAEnum, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .models import RequestStatus, RequestUrgency

class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20), unique=True)
    address: Mapped[str] = mapped_column(String(255))

class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(nullable=True)

    message: Mapped[str] = mapped_column(String(1000))

    issue: Mapped[str | None] = mapped_column(String(255), nullable=True)
    service: Mapped[str | None] = mapped_column(String(100), nullable=True)
    urgency: Mapped[RequestUrgency | None] = mapped_column(
        SAEnum(
            RequestUrgency,
            values_callable=lambda enum_class: [
                member.value for member in enum_class
            ],
        ),
        nullable=True,
    )
    preferred_date: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    preferred_time: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(
            RequestStatus,
            values_callable=lambda enum_class: [
                member.value for member in enum_class
            ],
        )
    )