from sqlalchemy import (
    Column,
    Enum as SAEnum,
    ForeignKey,
    String,
    Table,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .models import RequestStatus, RequestUrgency


class Base(DeclarativeBase):
    pass


# Many-to-many relationship between technicians and services.
technician_services = Table(
    "technician_services",
    Base.metadata,
    Column(
        "technician_id",
        ForeignKey("technicians.id"),
        primary_key=True,
    ),
    Column(
        "service_id",
        ForeignKey("services.id"),
        primary_key=True,
    ),
)


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


class Technician(Base):
    __tablename__ = "technicians"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(50),
        default="admin",
        nullable=False,
    )
class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        index=True,
    )
    customer_id: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    message: Mapped[str] = mapped_column(String(1000))

    issue: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    service: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

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
        String(10),
        nullable=True,
    )

    preferred_time: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    status: Mapped[RequestStatus] = mapped_column(
        SAEnum(
            RequestStatus,
            values_callable=lambda enum_class: [
                member.value for member in enum_class
            ],
        )
    )

class TechnicianAvailability(Base):
    __tablename__ = "technician_availability"

    id: Mapped[int] = mapped_column(primary_key=True)

    technician_id: Mapped[int] = mapped_column(
        ForeignKey("technicians.id"),
        nullable=False,
    )

    available_date: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    start_time: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
    )

    end_time: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
    )

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)

    service_request_id: Mapped[int] = mapped_column(
        ForeignKey("service_requests.id"),
        nullable=False,
    )

    technician_id: Mapped[int] = mapped_column(
        ForeignKey("technicians.id"),
        nullable=False,
    )

    appointment_date: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    start_time: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
    )

    end_time: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )