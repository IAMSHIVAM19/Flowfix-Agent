from google.genai import types

from .customer_tools import get_customer, list_customers, search_customers
from .scheduling_tools import (
    check_availability,
    create_booking,
    list_appointments,
    list_service_requests,
    list_technicians,
    send_confirmation,
)


TOOLS = {
    "get_customer": get_customer,
    "list_customers": list_customers,
    "search_customers": search_customers,
    "check_availability": check_availability,
    "list_appointments": list_appointments,
    "list_technicians": list_technicians,
    "list_service_requests": list_service_requests,
    "create_booking": create_booking,
    "send_confirmation": send_confirmation,
}


# Tools the agent may use without an explicit customer action.
READ_ONLY_TOOLS = {
    "get_customer",
    "list_customers",
    "search_customers",
    "check_availability",
    "list_appointments",
    "list_technicians",
    "list_service_requests",
}


# Tools that change application state or create an external-facing action.
ACTION_TOOLS = {
    "create_booking",
    "send_confirmation",
}


TOOL_SCHEMAS = {
    "get_customer": {
        "name": "get_customer",
        "description": (
            "Retrieve an existing FlowFix customer using "
            "their phone number or name."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "phone": {
                    "type": "string",
                    "description": (
                        "Customer phone number."
                    ),
                },
                "name": {
                    "type": "string",
                    "description": (
                        "Customer name (full or partial)."
                    ),
                },
            },
        },
    },

    "list_customers": {
        "name": "list_customers",
        "description": (
            "List all existing FlowFix customers currently stored in the database "
            "with their names, phone numbers, and service addresses."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of customers to retrieve (default 20).",
                },
            },
        },
    },

    "search_customers": {
        "name": "search_customers",
        "description": (
            "Search for existing FlowFix customers in the database by "
            "name, phone number, or address keyword, or leave blank to list customers."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "Name, phone number, or address keyword to search for (e.g. 'Conrad Fisher', 'Chloe', '0417222656')."
                    ),
                },
            },
        },
    },

    "check_availability": {
        "name": "check_availability",
        "description": (
            "Find available technicians and appointment "
            "options for a requested plumbing service."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "service": {
                    "type": "string",
                    "description": (
                        "Requested plumbing service."
                    ),
                },
                "appointment_date": {
                    "type": "string",
                    "description": (
                        "Requested appointment date in "
                        "YYYY-MM-DD format."
                    ),
                },
                "preferred_time": {
                    "type": "string",
                    "description": (
                        "Requested time period, such as "
                        "'morning' or 'afternoon'."
                    ),
                },
                "urgency": {
                    "type": "string",
                    "description": (
                        "Request urgency: low, normal, or high."
                    ),
                },
            },
            "required": [
                "service",
                "appointment_date",
                "preferred_time",
            ],
        },
    },

    "create_booking": {
        "name": "create_booking",
        "description": (
            "Create a confirmed appointment using one "
            "of the available appointment options."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "service_request_id": {
                    "type": "integer",
                    "description": (
                        "Internal FlowFix service request ID."
                    ),
                },
                "option": {
                    "type": "object",
                    "description": (
                        "Appointment option returned by "
                        "check_availability."
                    ),
                },
                "service_name": {
                    "type": "string",
                    "description": (
                        "Service being booked."
                    ),
                },
            },
            "required": [
                "service_request_id",
                "option",
                "service_name",
            ],
        },
    },

    "send_confirmation": {
        "name": "send_confirmation",
        "description": (
            "Create a simulated customer appointment "
            "confirmation record."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "service_request_id": {
                    "type": "integer",
                    "description": (
                        "Internal FlowFix service request ID."
                    ),
                },
                "customer_name": {
                    "type": "string",
                    "description": (
                        "Customer's name."
                    ),
                },
                "technician_name": {
                    "type": "string",
                    "description": (
                        "Assigned technician's name."
                    ),
                },
                "appointment_date": {
                    "type": "string",
                    "description": (
                        "Confirmed appointment date."
                    ),
                },
                "start_time": {
                    "type": "string",
                    "description": (
                        "Appointment start time."
                    ),
                },
                "end_time": {
                    "type": "string",
                    "description": (
                        "Appointment end time."
                    ),
                },
            },
            "required": [
                "service_request_id",
                "customer_name",
                "technician_name",
                "appointment_date",
                "start_time",
                "end_time",
            ],
        },
    },

    "list_appointments": {
        "name": "list_appointments",
        "description": (
            "List existing confirmed or scheduled appointments in the system "
            "with customer names, service type, technician, date, and times."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "description": "Appointment status filter (e.g. 'confirmed', 'cancelled', 'all'). Defaults to 'confirmed'.",
                },
                "technician_name": {
                    "type": "string",
                    "description": "Optional technician name filter (e.g. 'Alex', 'Sarah').",
                },
                "appointment_date": {
                    "type": "string",
                    "description": "Optional date filter in YYYY-MM-DD format.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of appointments to return (default 10).",
                },
            },
        },
    },

    "list_technicians": {
        "name": "list_technicians",
        "description": (
            "List all technicians and the plumbing services/skills they are certified to handle "
            "(e.g. tap repair, toilet repair, shower repair, leak investigation, blocked drains, hot water system, burst pipe repair, gas fitting, roof plumbing, backflow prevention)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "service_name": {
                    "type": "string",
                    "description": "Optional service filter (e.g. 'hot water system', 'blocked drains', 'tap repair', 'gas fitting').",
                },
            },
        },
    },

    "list_service_requests": {
        "name": "list_service_requests",
        "description": (
            "List customer service requests, optionally filtered by urgency (e.g. 'high', 'normal') "
            "or status to identify actionable triage items."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "urgency": {
                    "type": "string",
                    "description": "Urgency filter ('high', 'normal', 'low').",
                },
                "status": {
                    "type": "string",
                    "description": "Request status filter.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max requests to return (default 10).",
                },
            },
        },
    },
}


def build_gemini_tools(
    include_actions: bool = False,
):
    declarations = []

    allowed_tools = (
        TOOLS.keys()
        if include_actions
        else READ_ONLY_TOOLS
    )

    for tool_name in allowed_tools:
        schema = TOOL_SCHEMAS[tool_name]

        declarations.append(
            types.FunctionDeclaration(
                name=schema["name"],
                description=schema["description"],
                parameters=schema["parameters"],
            )
        )

    return [
        types.Tool(
            function_declarations=declarations
        )
    ]