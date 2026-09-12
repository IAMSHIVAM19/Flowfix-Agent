from enum import Enum

from pydantic import BaseModel, Field


# ============================================================
# ENUMS
# ============================================================

class RequestStatus(str, Enum):
    RECEIVED = "received"

    AWAITING_CUSTOMER_CONFIRMATION = (
        "awaiting_customer_confirmation"
    )

    AWAITING_INFORMATION = (
        "awaiting_information"
    )

    AWAITING_APPOINTMENT_SELECTION = (
        "awaiting_appointment_selection"
    )

    NO_AVAILABILITY = "no_availability"

    CONFIRMED = "confirmed"
    AWAITING_TECHNICIAN = "awaiting_technician"


class RequestUrgency(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


# ============================================================
# CUSTOMER REQUEST / REQUEST PROCESSING
# ============================================================

class CustomerRequest(BaseModel):
    name: str = Field(min_length=1)
    phone: str = Field(min_length=8)
    address: str = Field(min_length=1)
    message: str = Field(min_length=1)


class CustomerConfirmationRequest(BaseModel):
    name: str = Field(min_length=1)
    phone: str = Field(min_length=8)
    address: str = Field(min_length=1)


class CustomerInformationResponse(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000,
    )


class AgentOperationRequest(BaseModel):
    request_id: str | None = None

    message: str = Field(
        min_length=1,
        max_length=2000,
    )


class AdminBookAppointmentRequest(BaseModel):
    technician_id: int
    appointment_date: str = Field(min_length=10, max_length=10)
    start_time: str = Field(min_length=4, max_length=5)
    end_time: str = Field(min_length=4, max_length=5)
    service_name: str | None = None


class RequestExtraction(BaseModel):
    issue: str = Field(min_length=1)

    service: str | None = None

    urgency: RequestUrgency | None = None

    preferred_date: str | None = None

    preferred_weekday: str | None = None

    preferred_time: str | None = None

    needs_follow_up: bool = False

    follow_up_question: str | None = None


# ============================================================
# SCHEDULING
# ============================================================

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

    appointment_options: list[AppointmentOption] = Field(
        default_factory=list
    )


class AppointmentConfirmation(BaseModel):
    option_id: str = Field(min_length=1)


class AgentToolCall(BaseModel):
    tool_name: str
    arguments: dict
    result: dict | list | None = None


class AgentResult(BaseModel):
    status: str
    message: str
    tool_calls: list[AgentToolCall] = Field(
        default_factory=list
    )


class AgentSchedulingResult(BaseModel):
    status: str
    message: str

    appointment_options: list[
        AppointmentOption
    ] = Field(
        default_factory=list
    )


# ============================================================
class QuoteEstimate(BaseModel):
    service_name: str
    urgency: str
    pricing_tier: str
    callout_fee: int
    urgency_surcharge: int
    estimated_min: int
    estimated_max: int
    currency: str = "AUD"
    complexity: str
    description: str
    summary: str
    is_estimate: bool = True


class RequestResponse(BaseModel):
    request_id: str
    status: RequestStatus
    message: str

    appointment_options: list[AppointmentOption] = Field(
        default_factory=list
    )

    quote_estimate: QuoteEstimate | None = None


class ExtractionResult(BaseModel):
    status: str
    message: str
    extraction: RequestExtraction | None = None


# ============================================================
# NOTIFICATIONS
# ============================================================

class NotificationResponse(BaseModel):
    id: int

    service_request_id: int | None = None

    recipient_type: str

    notification_type: str

    message: str

    status: str


class NotificationCreateRequest(BaseModel):
    service_request_id: int | None = None

    recipient_type: str = Field(
        pattern="^(customer|admin|technician)$"
    )

    notification_type: str = Field(
        min_length=1,
        max_length=100,
    )

    message: str = Field(
        min_length=1,
        max_length=2000,
    )


class NotificationStatusUpdateRequest(BaseModel):
    status: str = Field(
        pattern="^(simulated|acknowledged)$"
    )


# ============================================================
# CUSTOMER RESPONSE SCHEMAS
# ============================================================

class CustomerSummary(BaseModel):
    id: int
    name: str
    phone: str
    address: str

    request_count: int
    appointment_count: int
    requests_count: int | None = None
    appointments_count: int | None = None


class CustomerRequestHistory(BaseModel):
    id: int
    request_id: str

    issue: str | None = None
    service: str | None = None
    urgency: RequestUrgency | None = None

    preferred_date: str | None = None
    preferred_time: str | None = None

    status: RequestStatus


class CustomerAppointmentHistory(BaseModel):
    id: int
    service_request_id: int
    technician_id: int

    appointment_date: str
    start_time: str
    end_time: str

    status: str


class CustomerDetail(BaseModel):
    id: int
    name: str
    phone: str
    address: str

    requests: list[CustomerRequestHistory] = Field(
        default_factory=list
    )

    appointments: list[
        CustomerAppointmentHistory
    ] = Field(
        default_factory=list
    )


# ============================================================
# REQUEST LIST / DETAIL
# ============================================================

class RequestListItem(BaseModel):
    id: int
    request_id: str
    customer_id: int | None = None
    message: str

    issue: str | None = None
    service: str | None = None
    urgency: RequestUrgency | None = None

    preferred_date: str | None = None
    preferred_time: str | None = None

    status: RequestStatus

    quote_estimate: QuoteEstimate | None = None


class RequestAppointmentDetail(BaseModel):
    id: int
    technician_id: int
    technician_name: str | None = None

    appointment_date: str
    start_time: str
    end_time: str

    status: str
    declined_reason: str | None = None
    technician_notes: str | None = None


class RequestDetailResponse(BaseModel):
    id: int
    request_id: str
    customer_id: int | None = None
    message: str

    issue: str | None = None
    service: str | None = None
    urgency: RequestUrgency | None = None

    preferred_date: str | None = None
    preferred_time: str | None = None

    status: RequestStatus

    appointment: RequestAppointmentDetail | None = None

    quote_estimate: QuoteEstimate | None = None


# ============================================================
# APPOINTMENTS
# ============================================================

class AppointmentCustomer(BaseModel):
    id: int
    name: str
    phone: str
    address: str


class AppointmentTechnician(BaseModel):
    id: int
    name: str


class AppointmentResponse(BaseModel):
    id: int

    service_request_id: int | None = None
    request_id: str | None = None

    customer: AppointmentCustomer | None = None

    technician: AppointmentTechnician | None = None

    service: str | None = None
    issue: str | None = None

    appointment_date: str
    start_time: str
    end_time: str

    status: str

    quote_estimate: QuoteEstimate | None = None

    technician_notes: str | None = None

    declined_reason: str | None = None


# ============================================================
# TECHNICIANS
# ============================================================

class TechnicianAppointment(BaseModel):
    id: int
    service_request_id: int

    appointment_date: str
    start_time: str
    end_time: str

    status: str


class TechnicianResponse(BaseModel):
    id: int
    name: str

    services: list[str] = Field(
        default_factory=list
    )

    appointments: list[
        TechnicianAppointment
    ] = Field(
        default_factory=list
    )


class TechnicianServiceResponse(BaseModel):
    id: int
    name: str


class TechnicianCreateRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    service_ids: list[int] = Field(
        min_length=1,
    )


class TechnicianAvailability(BaseModel):
    id: int
    available_date: str
    start_time: str
    end_time: str


class TechnicianAvailabilityResponse(BaseModel):
    technician_id: int
    technician_name: str

    availability: list[
        TechnicianAvailability
    ] = Field(
        default_factory=list
    )


# ============================================================
# DASHBOARD
# ============================================================

class DashboardSummaryResponse(BaseModel):
    total_requests: int
    awaiting_information: int
    no_availability: int
    awaiting_appointment_selection: int
    confirmed: int
    awaiting_technician: int = 0


# ============================================================
# ADMIN AUTHENTICATION
# ============================================================

class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============================================================
# ADMIN USER MANAGEMENT
# ============================================================

class AdminUserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool


class AdminUserCreateRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=100,
    )

    password: str = Field(
        min_length=8
    )

    role: str = Field(
        pattern="^(admin|operations)$"
    )


class AdminUserStatusUpdateRequest(BaseModel):
    is_active: bool


class AdminUserRoleUpdateRequest(BaseModel):
    role: str = Field(
        pattern="^(admin|operations)$"
    )


# ============================================================
# TECHNICIAN PORTAL
# ============================================================

class TechnicianLoginRequest(BaseModel):
    username_or_id: str
    pin: str = "1234"


class TechnicianLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    technician_id: int
    technician_name: str


class TechnicianProfileResponse(BaseModel):
    id: int
    name: str
    phone: str | None = None
    services: list[str] = Field(default_factory=list)
    status: str = "active"
    today_jobs_count: int = 0
    upcoming_jobs_count: int = 0
    completed_jobs_count: int = 0


class TechnicianBookingItem(BaseModel):
    id: int
    service_request_id: int
    request_id: str | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_address: str | None = None
    service: str | None = None
    issue: str | None = None
    urgency: str | None = None
    appointment_date: str
    start_time: str
    end_time: str
    status: str
    quote_estimate: QuoteEstimate | None = None
    technician_notes: str | None = None
    declined_reason: str | None = None


class TechnicianBookingsResponse(BaseModel):
    up_next: TechnicianBookingItem | None = None
    today: list[TechnicianBookingItem] = Field(default_factory=list)
    upcoming: list[TechnicianBookingItem] = Field(default_factory=list)
    completed: list[TechnicianBookingItem] = Field(default_factory=list)


class TechnicianStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(accepted|declined|en_route|completed)$")
    reason: str | None = None
    notes: str | None = None