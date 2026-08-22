from sqlalchemy import Enum as SAEnum, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .models import RequestStatus


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(20), unique=True)
    address: Mapped[str] = mapped_column(String(255))


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(nullable=True)
    message: Mapped[str] = mapped_column(String(1000))
    status: Mapped[RequestStatus] = mapped_column(
    SAEnum(
        RequestStatus,
        values_callable=lambda enum_class: [member.value for member in enum_class],
    )
)