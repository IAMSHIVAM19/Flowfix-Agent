from pydantic import BaseModel, Field
from enum import Enum

class RequestStatus(str, Enum):
    RECEIVED = "received"
    AWAITING_CUSTOMER_CONFIRMATION = "awaiting_customer_confirmation"

class CustomerRequest(BaseModel):
    name: str = Field(min_length=1)
    phone: str = Field(min_length=8)
    address: str = Field(min_length=1)
    message: str = Field(min_length=1)

class RequestResponse(BaseModel):
    request_id: str
    status: RequestStatus
    message: str