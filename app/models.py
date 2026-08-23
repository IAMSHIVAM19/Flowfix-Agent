from enum import Enum
import uuid
from pydantic import BaseModel, Field


class RequestStatus(str, Enum):
    RECEIVED = "received"
    AWAITING_CUSTOMER_CONFIRMATION = "awaiting_customer_confirmation"
    AWAITING_INFORMATION = "awaiting_information"
    AWAITING_APPOINTMENT_SELECTION = "awaiting_appointment_selection"
    CONFIRMED = "confirmed"



class RequestUrgency(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


class CustomerRequest(BaseModel):
    name: str = Field(min_length=1)
    phone: str = Field(min_length=8)
    address: str = Field(min_length=1)
    message: str = Field(min_length=1)


class RequestResponse(BaseModel):
    request_id: str
    status: RequestStatus
    message: str
    appointment_options: list[AppointmentOption] = Field(
        default_factory=list
    )

class RequestExtraction(BaseModel):
    issue: str = Field(min_length=1)
    service: str | None = None
    urgency: RequestUrgency | None = None
    preferred_date: str | None = None
    preferred_weekday: str | None = None
    preferred_time: str | None = None

class ExtractionResult(BaseModel):
    status: str
    message: str
    extraction: RequestExtraction | None = None

class AppointmentOption(BaseModel):
    option_id: str
    technician_id: int
    technician_name: str
    appointment_date: str
    start_time: str
    end_time: str

class SchedulingResult(BaseModel):
    status: str
    message: str
    extraction: RequestExtraction | None = None
    appointment_options: list[AppointmentOption] = []

class AppointmentConfirmation(BaseModel):
    option_id: str = Field(min_length=1)