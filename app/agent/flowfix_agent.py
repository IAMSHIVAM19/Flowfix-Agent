from datetime import date, timedelta
import inspect
import json
import os
from types import SimpleNamespace

from dotenv import load_dotenv
from ollama import Client
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import (
    AgentResult,
    AgentSchedulingResult,
    AgentToolCall,
    AppointmentOption,
    RequestExtraction,
)
from ..models_db import Appointment, Customer, ServiceRequest
from ..services.conversation_service import (
    get_request_messages,
)
from ..tools.registry import (
    ACTION_TOOLS,
    READ_ONLY_TOOLS,
    TOOLS,
    TOOL_SCHEMAS,
)
from ..services.scheduling_service import (
    get_options_for_extraction,
)



class FlowFixAgent:
    """
    Coordinates the tools available to the FlowFix agent.

    The agent does not directly implement business operations.
    It interacts with the application through registered tools
    and receives authoritative request context from the API.
    """

    def __init__(self, db: Session):
        self.db = db

    # ========================================================
    # DIRECT TOOL METHODS
    # ========================================================

    def get_customer(
        self,
        phone: str | None = None,
        name: str | None = None,
    ) -> dict | None:
        return TOOLS["get_customer"](
            db=self.db,
            phone=phone,
            name=name,
        )

    def search_customers(
        self,
        query: str = "",
    ) -> list[dict]:
        return TOOLS["search_customers"](
            db=self.db,
            query=query,
        )

    def check_availability(
        self,
        service: str,
        appointment_date: str,
        preferred_time: str,
        urgency: str | None = None,
    ) -> list[dict]:
        return TOOLS["check_availability"](
            db=self.db,
            service=service,
            appointment_date=appointment_date,
            preferred_time=preferred_time,
            urgency=urgency,
        )

    def create_booking(
        self,
        service_request_id: int,
        option: dict,
        service_name: str,
    ) -> dict:
        return TOOLS["create_booking"](
            db=self.db,
            service_request_id=service_request_id,
            option=option,
            service_name=service_name,
        )

    def send_confirmation(
        self,
        service_request_id: int,
        customer_name: str,
        technician_name: str,
        appointment_date: str,
        start_time: str,
        end_time: str,
    ) -> dict:
        return TOOLS["send_confirmation"](
            db=self.db,
            service_request_id=service_request_id,
            customer_name=customer_name,
            technician_name=technician_name,
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
        )

    def list_appointments(
        self,
        status: str | None = "confirmed",
        technician_name: str | None = None,
        appointment_date: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        return TOOLS["list_appointments"](
            db=self.db,
            status=status,
            technician_name=technician_name,
            appointment_date=appointment_date,
            limit=limit,
        )

    def list_technicians(
        self,
        service_name: str | None = None,
    ) -> list[dict]:
        return TOOLS["list_technicians"](
            db=self.db,
            service_name=service_name,
        )

    def list_service_requests(
        self,
        urgency: str | None = None,
        status: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        return TOOLS["list_service_requests"](
            db=self.db,
            urgency=urgency,
            status=status,
            limit=limit,
        )

    # ========================================================
    # TOOL EXECUTION
    # ========================================================

    def execute_tool(
        self,
        tool_name: str,
        arguments: dict,
    ):
        """
        Execute a registered read-only tool safely.

        Local models can occasionally include unnecessary
        arguments in a tool call. Before execution, arguments
        are filtered against the actual Python function
        signature so unsupported arguments cannot cause
        a TypeError.
        """

        if tool_name not in TOOL_SCHEMAS:
            raise ValueError(
                f"Tool is not allowed: {tool_name}"
            )

        if tool_name in ACTION_TOOLS:
            raise PermissionError(
                "Action tool requires explicit "
                f"application approval: {tool_name}"
            )

        if tool_name not in READ_ONLY_TOOLS:
            raise PermissionError(
                "Only read-only tools may be executed "
                f"automatically: {tool_name}"
            )

        tool = TOOLS.get(tool_name)

        if tool is None:
            raise ValueError(
                f"Tool implementation not found: {tool_name}"
            )

        signature = inspect.signature(tool)

        accepted_arguments = {
            name
            for name, parameter in signature.parameters.items()
            if name != "db"
            and parameter.kind
            in (
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                inspect.Parameter.KEYWORD_ONLY,
            )
        }

        filtered_arguments = {
            key: value
            for key, value in arguments.items()
            if key in accepted_arguments
        }

        return tool(
            db=self.db,
            **filtered_arguments,
        )

    # ========================================================
    # LLM CLIENT & PROVIDER
    # ========================================================

    def get_provider(self) -> str:
        load_dotenv(override=True)
        return os.getenv("LLM_PROVIDER", "ollama").strip().lower()

    def get_openrouter_client(self):
        from ..services.openrouter_service import get_openrouter_client
        return get_openrouter_client()

    def get_ollama_client(self) -> Client:
        host = os.getenv(
            "OLLAMA_HOST",
            "http://127.0.0.1:11434",
        )

        return Client(
            host=host,
        )

    def get_model(self) -> str:
        load_dotenv(override=True)
        provider = self.get_provider()
        if provider == "openrouter":
            return os.getenv(
                "OPENROUTER_MODEL",
                "meta-llama/llama-3.3-70b-instruct:free",
            ).strip()
        return os.getenv(
            "LLM_MODEL",
            "qwen2.5:3b",
        ).strip()

    def build_ollama_tools(
        self,
        include_actions: bool = False,
    ) -> list[dict]:
        """
        Build tool definitions in standard OpenAI/Ollama function format.

        By default, only read-only tools are exposed.
        Action tools can only be included explicitly.
        """

        if include_actions:
            allowed_tools = TOOLS.keys()
        else:
            allowed_tools = READ_ONLY_TOOLS

        return [
            {
                "type": "function",
                "function": {
                    "name": TOOL_SCHEMAS[
                        tool_name
                    ]["name"],
                    "description": TOOL_SCHEMAS[
                        tool_name
                    ]["description"],
                    "parameters": TOOL_SCHEMAS[
                        tool_name
                    ]["parameters"],
                },
            }
            for tool_name in allowed_tools
        ]

    def ask_for_tool_call(
        self,
        messages: list[dict],
    ):
        provider = self.get_provider()
        tools = self.build_ollama_tools()

        if provider == "openrouter":
            client = self.get_openrouter_client()
            clean_messages = []
            for m in messages:
                role = m.get("role")
                content = str(m.get("content", "") or "")
                if role == "tool":
                    clean_messages.append({
                        "role": "tool",
                        "tool_call_id": m.get("tool_call_id", f"call_{m.get('tool_name', 'tool')}"),
                        "content": content,
                    })
                elif role == "assistant" and m.get("tool_calls"):
                    clean_messages.append({
                        "role": "assistant",
                        "content": m.get("content"),
                        "tool_calls": m.get("tool_calls"),
                    })
                elif role == "system" and clean_messages and clean_messages[-1].get("role") == "system":
                    clean_messages[-1]["content"] += f"\n\n{content}"
                else:
                    clean_messages.append({
                        "role": role,
                        "content": content,
                    })

            import time

            last_error = None
            for attempt in range(2):
                try:
                    completion = client.chat.completions.create(
                        model=self.get_model(),
                        messages=clean_messages,
                        tools=tools,
                        temperature=0.1,
                    )
                    choices = getattr(completion, "choices", None)
                    if choices and len(choices) > 0:
                        choice = choices[0]
                        msg = getattr(choice, "message", None)
                        content = getattr(msg, "content", "") if msg else ""
                        tool_calls = getattr(msg, "tool_calls", []) if msg else []
                        return SimpleNamespace(
                            message=SimpleNamespace(
                                content=content or "",
                                tool_calls=tool_calls or [],
                            )
                        )
                    last_error = getattr(completion, "error", None) or "The language model returned an empty response."
                except Exception as exc:
                    last_error = exc

                if attempt == 0:
                    time.sleep(1.5)

            error_str = str(last_error)
            if "502" in error_str or "overloaded" in error_str.lower():
                user_msg = "The AI model is momentarily busy on OpenRouter free tier. Please retry in a few seconds."
            else:
                user_msg = f"AI service response: {error_str}"

            return SimpleNamespace(
                message=SimpleNamespace(
                    content=user_msg,
                    tool_calls=[],
                )
            )

        client = self.get_ollama_client()

        return client.chat(
            model=self.get_model(),
            messages=messages,
            tools=tools,
            stream=False,
        )

    # ========================================================
    # TOOL CALL EXTRACTION
    # ========================================================

    def get_tool_calls(
        self,
        response,
    ):
        if response is None:
            return []

        message = getattr(response, "message", None)
        if message is None:
            return []

        raw_calls = getattr(message, "tool_calls", None) or []
        normalized_calls = []

        for idx, call in enumerate(raw_calls):
            func = getattr(call, "function", None)
            if func is None and isinstance(call, dict):
                func = call.get("function", {})

            if func is None:
                continue

            name = getattr(func, "name", None) or (func.get("name") if isinstance(func, dict) else "")
            args = getattr(func, "arguments", None) or (func.get("arguments") if isinstance(func, dict) else {})

            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except Exception:
                    args = {}
            elif not isinstance(args, dict):
                try:
                    args = dict(args)
                except Exception:
                    args = {}

            call_id = getattr(call, "id", None) or (call.get("id") if isinstance(call, dict) else None) or f"call_{idx}_{name}"

            normalized_calls.append(
                SimpleNamespace(
                    id=call_id,
                    function=SimpleNamespace(
                        name=name,
                        arguments=args,
                    ),
                )
            )

        return normalized_calls

    # ========================================================
    # CONVERSATION
    # ========================================================

    def get_conversation(
        self,
        service_request_id: int,
    ) -> list[dict]:
        return get_request_messages(
            db=self.db,
            service_request_id=service_request_id,
        )

    # ========================================================
    # BOOKING INTENT
    # ========================================================

    def is_booking_request(
    self,
    message: str,
    ) -> bool:
        text = message.strip().lower()

        booking_phrases = (
            "book",
            "make a booking",
            "make the booking",
            "confirm the appointment",
            "confirm appointment",
            "schedule it",
            "schedule this",
            "i want to book",
            "i'd like to book",
            "i would like to book",
        )

        words = set(text.split())

        # "book" must be a complete word.
        # This prevents "booked" / "booking" from being
        # incorrectly treated as an instruction to book.
        if "book" in words:
            return True

        return any(
            phrase in text
            for phrase in booking_phrases
            if phrase != "book"
        )

    # ========================================================
    # GENERAL OPERATIONS AGENT
    # ========================================================

    def run_operation(
        self,
        message: str,
        conversation: list[dict] | None = None,
        service_request: ServiceRequest | None = None,
        appointment: Appointment | None = None,
        max_tool_calls: int = 2,
    ) -> AgentResult:
        """
        Handle a general FlowFix operations request.

        Read-only tools may be used automatically.

        Booking and confirmation actions are never executed
        automatically. Explicit booking intent returns an
        approval-required result instead.
        """

        # ----------------------------------------------------
        # Protect state-changing actions
        # ----------------------------------------------------

        if self.is_booking_request(message):
            return AgentResult(
                status="approval_required",
                message=(
                    "I can help with that, but booking an "
                    "appointment requires explicit confirmation."
                ),
                tool_calls=[],
            )

        # ----------------------------------------------------
        # Load related customer and appointment directly.
        #
        # Request-specific facts should come from the database
        # rather than asking the local model to infer them.
        # ----------------------------------------------------

        customer = None

        if (
            service_request is not None
            and service_request.customer_id is not None
        ):
            customer = self.db.scalar(
                select(Customer)
                .where(
                    Customer.id
                    == service_request.customer_id
                )
            )

        if (
            appointment is None
            and service_request is not None
        ):
            appointment = self.db.scalar(
                select(Appointment)
                .where(
                    Appointment.service_request_id
                    == service_request.id
                )
                .order_by(
                    Appointment.id.desc()
                )
            )

        normalized_message = (
            message.strip().lower()
        )

        # ----------------------------------------------------
        # Handle customer database search queries
        # (e.g., "is there a customer named conrad fisher?",
        # "is there a customer named chloe", "find customer Marcus")
        # ----------------------------------------------------
        customer_search_indicators = (
            "customer named",
            "customer called",
            "named customer",
            "is there a customer",
            "do we have a customer",
            "any customer named",
            "find customer",
            "search customer",
            "look up customer",
            "lookup customer",
            "details for customer",
            "information on customer",
        )

        is_customer_search = any(
            phrase in normalized_message for phrase in customer_search_indicators
        )

        if is_customer_search:
            search_query = message.strip()
            for prefix in (
                "is there a customer named",
                "is there a customer called",
                "do we have a customer named",
                "do we have a customer called",
                "do we have a customer",
                "any customer named",
                "customer named",
                "customer called",
                "find customer",
                "search customer",
                "look up customer",
                "lookup customer",
                "details for customer",
                "information on customer",
            ):
                idx = normalized_message.find(prefix)
                if idx != -1:
                    search_query = message[idx + len(prefix):].strip()
                    break

            search_query = search_query.strip(" ?.,!:;\"'").strip()

            if search_query:
                matches = self.search_customers(search_query)
                if matches:
                    if len(matches) == 1:
                        c = matches[0]
                        reply = (
                            f"Yes, found **{c['name']}** (Customer #{c['customer_id']}) in the database:\n"
                            f"• **Phone**: {c['phone']}\n"
                            f"• **Address**: {c['address']}"
                        )
                    else:
                        lines = [f"Found {len(matches)} customer(s) matching **{search_query}**:\n"]
                        for c in matches:
                            lines.append(
                                f"• **{c['name']}** (Customer #{c['customer_id']}) – 📞 {c['phone']} | 📍 {c['address']}"
                            )
                        reply = "\n".join(lines)

                    return AgentResult(
                        status="completed",
                        message=reply,
                        tool_calls=[
                            AgentToolCall(
                                tool_name="search_customers",
                                arguments={"query": search_query},
                                result=matches,
                            )
                        ],
                    )
                else:
                    return AgentResult(
                        status="completed",
                        message=f"I checked the customer database, but found no customer matching **{search_query}**.",
                        tool_calls=[
                            AgentToolCall(
                                tool_name="search_customers",
                                arguments={"query": search_query},
                                result=[],
                            )
                        ],
                    )

        # ----------------------------------------------------
        # Handle full customer listing queries
        # ----------------------------------------------------
        if any(kw in normalized_message for kw in ("list all customers", "show all customers", "list customers", "show customers", "view customers")):
            all_custs = self.search_customers("")
            if not all_custs:
                msg = "There are currently no customers in the database."
            else:
                lines = [f"Found {len(all_custs)} customer(s) in the database:\n"]
                for c in all_custs:
                    lines.append(f"• **{c['name']}** (ID #{c['customer_id']}) – 📞 {c['phone']} | 📍 {c['address']}")
                msg = "\n".join(lines)
            return AgentResult(
                status="completed",
                message=msg,
                tool_calls=[
                    AgentToolCall(
                        tool_name="search_customers",
                        arguments={"query": ""},
                        result=all_custs,
                    )
                ],
            )

        # ----------------------------------------------------
        # Handle questions specifically about THIS request's customer
        # ----------------------------------------------------
        request_customer_phrases = (
            "who is the customer for this request",
            "who is the customer on this request",
            "customer for this request",
            "customer on this request",
            "who is this customer",
            "who is the customer",
            "what is the customer's name",
            "what is the customer name",
            "customer details for this request",
            "customer info for this request",
        )

        is_request_customer_question = (
            any(phrase in normalized_message for phrase in request_customer_phrases)
            and not any(kw in normalized_message for kw in ("named", "called", "is there", "search", "find", "list"))
        )

        if is_request_customer_question:
            if service_request is None:
                return AgentResult(
                    status="completed",
                    message="Please select a service request or specify a customer name/phone number to search for.",
                    tool_calls=[],
                )

            if customer is None:
                return AgentResult(
                    status="completed",
                    message=(
                        "This request does not have a "
                        "customer associated with it."
                    ),
                    tool_calls=[],
                )

            return AgentResult(
                status="completed",
                message=(
                    f"The customer for this request is "
                    f"{customer.name}. "
                    f"Phone: {customer.phone}. "
                    f"Address: {customer.address}."
                ),
                tool_calls=[],
            )

        # ----------------------------------------------------
        # Handle service questions directly.
        # ----------------------------------------------------

        service_question_phrases = (
            "what service",
            "which service",
            "service does this customer need",
            "service for this request",
        )

        is_service_question = any(
            phrase in normalized_message
            for phrase in service_question_phrases
        )

        if is_service_question:
            if (
                service_request is None
                or not service_request.service
            ):
                return AgentResult(
                    status="completed",
                    message=(
                        "No service has been identified "
                        "for this request."
                    ),
                    tool_calls=[],
                )

            return AgentResult(
                status="completed",
                message=(
                    f"This request is for "
                    f"{service_request.service}."
                ),
                tool_calls=[],
            )

        # ----------------------------------------------------
        # Handle requested date/time questions directly.
        # ----------------------------------------------------

        requested_time_phrases = (
            "what date and time",
            "what date/time",
            "what date did",
            "what time did",
            "when did the customer request",
            "requested time",
            "preferred appointment",
            "preferred date",
            "preferred time",
        )

        is_requested_time_question = any(
            phrase in normalized_message
            for phrase in requested_time_phrases
        )

        if is_requested_time_question:
            if service_request is None:
                return AgentResult(
                    status="completed",
                    message=(
                        "The selected request information "
                        "is not available."
                    ),
                    tool_calls=[],
                )

            preferred_date = (
                service_request.preferred_date
                or "not specified"
            )
            preferred_time = (
                service_request.preferred_time
                or "not specified"
            )

            return AgentResult(
                status="completed",
                message=(
                    f"The customer requested "
                    f"{preferred_date} during the "
                    f"{preferred_time}."
                ),
                tool_calls=[],
            )

        # ----------------------------------------------------
        # Handle current appointment questions directly.
        # ----------------------------------------------------

        appointment_question_phrases = (
            "what appointment",
            "which appointment",
            "current appointment",
            "existing appointment",
            "scheduled appointment",
            "have an appointment",
            "has an appointment",
        )

        is_appointment_question = any(
            phrase in normalized_message
            for phrase in appointment_question_phrases
        )

        if service_request is not None and is_appointment_question:
            if appointment is None:
                return AgentResult(
                    status="completed",
                    message=(
                        "This customer currently does not "
                        "have a scheduled appointment."
                    ),
                    tool_calls=[],
                )

            appointment_status = getattr(
                appointment.status,
                "value",
                appointment.status,
            )

            return AgentResult(
                status="completed",
                message=(
                    "This customer currently has "
                    f"appointment #{appointment.id} with "
                    f"technician #{appointment.technician_id} "
                    f"on {appointment.appointment_date} "
                    f"from {appointment.start_time} to "
                    f"{appointment.end_time}. "
                    f"The appointment is "
                    f"{appointment_status}."
                ),
                tool_calls=[],
            )

        # ----------------------------------------------------
        # Handle general appointments listing query
        # ----------------------------------------------------
        list_appointment_keywords = (
            "list the confirmed appoitments",
            "list the confirmed appointments",
            "list confirmed appointments",
            "list appointments",
            "list appoitments",
            "confirmed appointments",
            "confirmed appoitments",
            "show confirmed appointments",
            "show appointments",
            "all appointments",
            "upcoming appointments",
            "view appointments",
        )

        is_list_appointments = any(
            kw in normalized_message for kw in list_appointment_keywords
        ) or (
            ("list" in normalized_message or "show" in normalized_message or "what" in normalized_message or "get" in normalized_message)
            and ("appointment" in normalized_message or "appoitment" in normalized_message)
            and "availability" not in normalized_message
            and "slot" not in normalized_message
        )

        if is_list_appointments:
            appointments_list = self.list_appointments(status="confirmed")
            if not appointments_list:
                return AgentResult(
                    status="completed",
                    message="There are currently no confirmed appointments in the system.",
                    tool_calls=[
                        AgentToolCall(
                            tool_name="list_appointments",
                            arguments={"status": "confirmed"},
                            result=[],
                        )
                    ],
                )

            summary_lines = [f"Found {len(appointments_list)} confirmed appointment(s) in the system:\n"]
            for a in appointments_list:
                summary_lines.append(
                    f"• **Appointment #{a['appointment_id']}**: {a['technician_name']} with {a['customer_name']} ({a['customer_phone']})\n"
                    f"  📅 Date: {a['appointment_date']} | ⏰ Time: {a['start_time']} – {a['end_time']} | 🔧 Service: {a['service']}\n"
                    f"  📍 Address: {a['customer_address']}"
                )

            return AgentResult(
                status="completed",
                message="\n".join(summary_lines),
                tool_calls=[
                    AgentToolCall(
                        tool_name="list_appointments",
                        arguments={"status": "confirmed"},
                        result=appointments_list,
                    )
                ],
            )

        # ----------------------------------------------------
        # Handle technician certifications query
        # ----------------------------------------------------
        tech_cert_keywords = (
            "burst pipe",
            "certified",
            "specialist",
            "who can handle",
            "technicians are certified",
        )
        if any(kw in normalized_message for kw in tech_cert_keywords) and "slot" not in normalized_message and "availability" not in normalized_message:
            techs = self.list_technicians()
            if "burst" in normalized_message or "leak" in normalized_message:
                qual_techs = [t for t in techs if "leak investigation" in t["certified_services"]]
                names = ", ".join(t["name"] for t in qual_techs)
                msg = f"The following technicians are certified for emergency burst pipes and leak investigations: **{names}**."
                return AgentResult(
                    status="completed",
                    message=msg,
                    tool_calls=[
                        AgentToolCall(
                            tool_name="list_technicians",
                            arguments={"service_name": "leak investigation"},
                            result=qual_techs,
                        )
                    ],
                )

        # ----------------------------------------------------
        # Handle high urgency requests query
        # ----------------------------------------------------
        urgency_keywords = (
            "high urgency",
            "actionable service requests",
            "dispatcher triage",
            "urgent requests",
        )
        if any(kw in normalized_message for kw in urgency_keywords):
            urgent_reqs = self.list_service_requests(urgency="high")
            if not urgent_reqs:
                urgent_reqs = self.list_service_requests()

            if not urgent_reqs:
                msg = "There are no urgent service requests requiring immediate triage."
            else:
                lines = [f"Found {len(urgent_reqs)} service request(s) requiring attention:\n"]
                for r in urgent_reqs:
                    lines.append(
                        f"• **Request {r['request_id'][:8]}** ({r['urgency'].upper()} Urgency) – {r['customer_name']} ({r['customer_phone']})\n"
                        f"  🔧 Service: {r['service']} | Status: {r['status']}\n"
                        f"  📅 Preferred: {r['preferred_date'] or 'Unspecified'} ({r['preferred_time'] or 'Any time'})"
                    )
                msg = "\n".join(lines)

            return AgentResult(
                status="completed",
                message=msg,
                tool_calls=[
                    AgentToolCall(
                        tool_name="list_service_requests",
                        arguments={"urgency": "high"},
                        result=urgent_reqs,
                    )
                ],
            )

        # ----------------------------------------------------
        # System instructions
        # ----------------------------------------------------

        system_message = {
        "role": "system",
        "content": (
            "You are the FlowFix operations assistant. "
            "You help operations staff with plumbing service "
            "requests, customer information, and appointment "
            "availability.\n\n"

            "When selected request information is provided "
            "in the request context, treat it as authoritative "
            "and use it directly.\n\n"

            "When customer information is provided in the "
            "request context, use it directly. Do not call "
            "get_customer merely to retrieve customer details "
            "that are already present.\n\n"

            "Do not call a tool merely to retrieve information "
            "that is already present in the request context.\n\n"

            "Use get_customer only when customer information "
            "actually needs to be looked up.\n\n"

            "Use check_availability only when appointment "
            "availability actually needs to be checked.\n\n"

            "For questions about the selected request's service, "
            "preferred date/time, customer, or current appointment, "
            "use the authoritative request context directly.\n\n"

            "If a current appointment is present in the request "
            "context, use that appointment information directly. "
            "Do not call check_availability to find an appointment "
            "that is already confirmed.\n\n"

            "If the request context says there is no current "
            "appointment, do not invent one.\n\n"

            "Do not invent customer information.\n"
            "Do not invent appointment availability.\n"
            "Do not create bookings.\n"
            "Do not send confirmations.\n\n"

            "Do not promise future monitoring, callbacks, "
            "follow-ups, reminders, or rechecks unless the "
            "application explicitly provides and has invoked a "
            "mechanism that schedules that action.\n\n"

            "When no appointment availability is found, state "
            "that no availability was found and explain that the "
            "customer should provide another date or time. "
            "Do not claim that FlowFix will automatically check "
            "again later.\n\n"

            "Booking and confirmation actions require the "
            "application's explicit confirmation flow.\n\n"

            "After receiving a tool result, answer the user's "
            "question directly.\n"

            "Do not repeatedly call the same tool with the "
            "same arguments.\n"

            "Do not add unnecessary arguments to tool calls."
        ),
    }

        messages = [
            system_message,
        ]

        # ----------------------------------------------------
        # Add authoritative request context
        # ----------------------------------------------------

        if service_request is not None:
            request_context = (
                "Selected FlowFix service request:\n"
                f"Request ID: "
                f"{service_request.request_id}\n"
                f"Issue: "
                f"{service_request.issue or 'Not specified'}\n"
                f"Service: "
                f"{service_request.service or 'Not specified'}\n"
                f"Urgency: "
                f"{service_request.urgency or 'Not specified'}\n"
                f"Preferred date: "
                f"{service_request.preferred_date or 'Not specified'}\n"
                f"Preferred time: "
                f"{service_request.preferred_time or 'Not specified'}"
            )

            if customer is not None:
                request_context += (
                    "\n\nCustomer:\n"
                    f"Customer ID: {customer.id}\n"
                    f"Name: {customer.name}\n"
                    f"Phone: {customer.phone}\n"
                    f"Address: {customer.address}"
                )
            else:
                request_context += (
                    "\n\nCustomer:\n"
                    "No customer is associated with this request."
                )

            if appointment is not None:
                appointment_status = getattr(
                    appointment.status,
                    "value",
                    appointment.status,
                )

                request_context += (
                    "\n\nCurrent appointment:\n"
                    f"Appointment ID: {appointment.id}\n"
                    f"Technician ID: "
                    f"{appointment.technician_id}\n"
                    f"Date: "
                    f"{appointment.appointment_date}\n"
                    f"Time: "
                    f"{appointment.start_time} - "
                    f"{appointment.end_time}\n"
                    f"Status: "
                    f"{appointment_status}"
                )
            else:
                request_context += (
                    "\n\nCurrent appointment:\n"
                    "No appointment is currently scheduled."
                )

            system_message["content"] += f"\n\n{request_context}"

        # ----------------------------------------------------
        # Add conversation history
        # ----------------------------------------------------

        if conversation:
            for previous_message in conversation:
                role = previous_message.get(
                    "role",
                    "user",
                )

                content = previous_message.get(
                    "content",
                    "",
                )

                if role not in {
                    "user",
                    "assistant",
                }:
                    continue

                if not content:
                    continue

                messages.append(
                    {
                        "role": role,
                        "content": content,
                    }
                )

        # ----------------------------------------------------
        # Add current user question
        # ----------------------------------------------------

        messages.append(
            {
                "role": "user",
                "content": message,
            }
        )

        executed_tools: list[AgentToolCall] = []

        previous_tool_calls: set[
            tuple[str, str]
        ] = set()

        # ----------------------------------------------------
        # Agent loop
        # ----------------------------------------------------

        for _ in range(max_tool_calls):
            response = self.ask_for_tool_call(
                messages
            )

            tool_calls = self.get_tool_calls(
                response
            )

            # ------------------------------------------------
            # Normal answer
            # ------------------------------------------------

            if not tool_calls:
                message_content = ""

                if response.message is not None:
                    message_content = (
                        response.message.content
                        or ""
                    )

                return AgentResult(
                    status="completed",
                    message=(
                        message_content
                        or "I couldn't generate a response."
                    ),
                    tool_calls=executed_tools,
                )

            # ------------------------------------------------
            # Preserve assistant tool-call message
            # ------------------------------------------------

            if response.message is not None:
                if hasattr(response.message, "model_dump"):
                    messages.append(
                        response.message.model_dump(
                            exclude_none=True
                        )
                    )
                elif isinstance(response.message, dict):
                    messages.append(response.message)
                else:
                    content = getattr(response.message, "content", "")
                    raw_tool_calls = [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": json.dumps(tc.function.arguments)
                                if isinstance(tc.function.arguments, dict)
                                else str(tc.function.arguments),
                            },
                        }
                        for tc in tool_calls
                    ]
                    messages.append({
                        "role": "assistant",
                        "content": content or None,
                        "tool_calls": raw_tool_calls if raw_tool_calls else None,
                    })

            # ------------------------------------------------
            # Execute requested tools
            # ------------------------------------------------

            for tool_call in tool_calls:
                tool_name = (
                    tool_call.function.name
                )

                arguments = dict(
                    tool_call.function.arguments
                )

                # --------------------------------------------
                # Block state-changing actions
                # --------------------------------------------

                if tool_name in ACTION_TOOLS:
                    return AgentResult(
                        status="approval_required",
                        message=(
                            "This action requires explicit "
                            "application approval."
                        ),
                        tool_calls=executed_tools,
                    )

                # --------------------------------------------
                # Only allow read-only tools
                # --------------------------------------------

                if tool_name not in READ_ONLY_TOOLS:
                    return AgentResult(
                        status="error",
                        message=(
                            f"Tool is not available for "
                            f"general operations: {tool_name}"
                        ),
                        tool_calls=executed_tools,
                    )

                # --------------------------------------------
                # Prevent repeated identical calls
                # --------------------------------------------

                call_key = (
                    tool_name,
                    str(
                        sorted(
                            arguments.items()
                        )
                    ),
                )

                if call_key in previous_tool_calls:
                    return AgentResult(
                        status="completed",
                        message=(
                            "I found the information needed, "
                            "but the agent attempted to repeat "
                            "the same lookup."
                        ),
                        tool_calls=executed_tools,
                    )

                previous_tool_calls.add(
                    call_key
                )

                # --------------------------------------------
                # Execute safe read-only tool
                # --------------------------------------------

                result = self.execute_tool(
                    tool_name,
                    arguments,
                )

                executed_tools.append(
                    AgentToolCall(
                        tool_name=tool_name,
                        arguments=arguments,
                        result=result,
                    )
                )

                # --------------------------------------------
                # Return tool result to the model
                # --------------------------------------------

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": getattr(tool_call, "id", None) or f"call_{tool_name}",
                        "tool_name": tool_name,
                        "name": tool_name,
                        "content": str(result),
                    }
                )

        # ----------------------------------------------------
        # Safety fallback
        # ----------------------------------------------------

        return AgentResult(
            status="completed",
            message=(
                "I found the requested information, "
                "but the agent did not produce a final response."
            ),
            tool_calls=executed_tools,
        )

    # ========================================================
    # SCHEDULING AGENT
    # ========================================================

    def run(
        self,
        extraction: RequestExtraction,
        conversation: list[dict] | None = None,
        max_tool_calls: int = 5,
    ) -> AgentResult:
        """
        Run the scheduling agent using an already validated
        request extraction.

        This agent can check availability but cannot create
        bookings or send confirmations.
        """

        system_message = {
            "role": "system",
            "content": (
                "You are the FlowFix scheduling assistant. "
                "You receive an already validated plumbing request. "
                "Do not reinterpret or change the request details. "
                "When appointment availability needs to be checked, "
                "use the check_availability tool. "
                "Do not create bookings or send confirmations. "
                "Do not invent availability. "
                "Do not add unnecessary tool arguments."
            ),
        }

        request_context = (
            "Validated FlowFix request:\n"
            f"Issue: {extraction.issue}\n"
            f"Service: {extraction.service}\n"
            f"Urgency: {extraction.urgency}\n"
            f"Preferred date: {extraction.preferred_date}\n"
            f"Preferred weekday: "
            f"{extraction.preferred_weekday}\n"
            f"Preferred time: {extraction.preferred_time}"
        )

        messages = [
            system_message,
        ]

        # ----------------------------------------------------
        # Add conversation history
        # ----------------------------------------------------

        if conversation:
            for previous_message in conversation:
                role = previous_message.get(
                    "role",
                    "user",
                )

                content = previous_message.get(
                    "content",
                    "",
                )

                if role not in {
                    "user",
                    "assistant",
                }:
                    continue

                if not content:
                    continue

                messages.append(
                    {
                        "role": role,
                        "content": content,
                    }
                )

        messages.append(
            {
                "role": "user",
                "content": request_context,
            }
        )

        executed_tools: list[AgentToolCall] = []

        previous_tool_calls: set[
            tuple[str, str]
        ] = set()

        # ----------------------------------------------------
        # Scheduling tool loop
        # ----------------------------------------------------

        for _ in range(max_tool_calls):
            response = self.ask_for_tool_call(
                messages
            )

            tool_calls = self.get_tool_calls(
                response
            )

            # ------------------------------------------------
            # Normal response
            # ------------------------------------------------

            if not tool_calls:
                message_content = ""

                if response.message is not None:
                    message_content = (
                        response.message.content
                        or ""
                    )

                return AgentResult(
                    status="completed",
                    message=(
                        message_content
                        or "I couldn't complete the scheduling request."
                    ),
                    tool_calls=executed_tools,
                )

            # ------------------------------------------------
            # Preserve assistant tool-call message
            # ------------------------------------------------

            if response.message is not None:
                if hasattr(response.message, "model_dump"):
                    messages.append(
                        response.message.model_dump(
                            exclude_none=True
                        )
                    )
                elif isinstance(response.message, dict):
                    messages.append(response.message)
                else:
                    content = getattr(response.message, "content", "")
                    raw_tool_calls = [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": json.dumps(tc.function.arguments)
                                if isinstance(tc.function.arguments, dict)
                                else str(tc.function.arguments),
                            },
                        }
                        for tc in tool_calls
                    ]
                    messages.append({
                        "role": "assistant",
                        "content": content or None,
                        "tool_calls": raw_tool_calls if raw_tool_calls else None,
                    })

            # ------------------------------------------------
            # Execute tools
            # ------------------------------------------------

            for tool_call in tool_calls:
                tool_name = (
                    tool_call.function.name
                )

                arguments = dict(
                    tool_call.function.arguments
                )

                # --------------------------------------------
                # Never execute action tools
                # --------------------------------------------

                if tool_name in ACTION_TOOLS:
                    return AgentResult(
                        status="approval_required",
                        message=(
                            "This action requires explicit "
                            "application approval."
                        ),
                        tool_calls=executed_tools,
                    )

                # --------------------------------------------
                # Only allow read-only tools
                # --------------------------------------------

                if tool_name not in READ_ONLY_TOOLS:
                    return AgentResult(
                        status="error",
                        message=(
                            f"Tool is not available for "
                            f"scheduling: {tool_name}"
                        ),
                        tool_calls=executed_tools,
                    )

                # --------------------------------------------
                # Prevent duplicate calls
                # --------------------------------------------

                call_key = (
                    tool_name,
                    str(
                        sorted(
                            arguments.items()
                        )
                    ),
                )

                if call_key in previous_tool_calls:
                    return AgentResult(
                        status="completed",
                        message=(
                            "The availability lookup was "
                            "repeated, so I stopped the agent."
                        ),
                        tool_calls=executed_tools,
                    )

                previous_tool_calls.add(
                    call_key
                )

                # --------------------------------------------
                # Execute read-only tool
                # --------------------------------------------

                result = self.execute_tool(
                    tool_name,
                    arguments,
                )

                executed_tools.append(
                    AgentToolCall(
                        tool_name=tool_name,
                        arguments=arguments,
                        result=result,
                    )
                )

                # --------------------------------------------
                # Feed tool result back to model
                # --------------------------------------------

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": getattr(tool_call, "id", None) or f"call_{tool_name}",
                        "tool_name": tool_name,
                        "name": tool_name,
                        "content": str(result),
                    }
                )

        # ----------------------------------------------------
        # Safety fallback
        # ----------------------------------------------------

        return AgentResult(
            status="completed",
            message=(
                "I found the requested scheduling information, "
                "but the agent did not produce a final response."
            ),
            tool_calls=executed_tools,
        )

    # ========================================================
    # SCHEDULING RESULT
    # ========================================================

    def get_scheduling_result(
        self,
        extraction: RequestExtraction,
        conversation: list[dict] | None = None,
        max_tool_calls: int = 5,
    ) -> AgentSchedulingResult:
        # ----------------------------------------------------
        # Fast-path: Direct deterministic check if extraction is complete
        # ----------------------------------------------------
        if (
            extraction.service
            and extraction.preferred_date
            and extraction.preferred_time
        ):
            direct_options = get_options_for_extraction(
                db=self.db,
                extraction=extraction,
            )

            if direct_options:
                first_option = direct_options[0]
                message = (
                    "We found an available appointment with "
                    f"{first_option.technician_name} on "
                    f"{first_option.appointment_date} from "
                    f"{first_option.start_time} to "
                    f"{first_option.end_time}."
                )
                return AgentSchedulingResult(
                    status="options_available",
                    message=message,
                    appointment_options=direct_options,
                )

        # ----------------------------------------------------
        # Agent reasoning loop if availability not found on first pass
        # ----------------------------------------------------
        result = self.run(
            extraction=extraction,
            conversation=conversation,
            max_tool_calls=max_tool_calls,
        )

        appointment_options: list[
            AppointmentOption
        ] = []

        for tool_call in result.tool_calls:
            if tool_call.tool_name != "check_availability":
                continue

            if not isinstance(
                tool_call.result,
                list,
            ):
                continue

            for option in tool_call.result:
                appointment_options.append(
                    AppointmentOption.model_validate(
                        option
                    )
                )

        # ----------------------------------------------------
        # Availability found via agent tool calling
        # ----------------------------------------------------


        if appointment_options:
            first_option = appointment_options[0]

            message = (
                "We found an available appointment with "
                f"{first_option.technician_name} on "
                f"{first_option.appointment_date} from "
                f"{first_option.start_time} to "
                f"{first_option.end_time}."
            )

            return AgentSchedulingResult(
                status="options_available",
                message=message,
                appointment_options=appointment_options,
            )

        # ----------------------------------------------------
        # Direct Deterministic Availability Fallback
        # ----------------------------------------------------
        direct_options = get_options_for_extraction(
            db=self.db,
            extraction=extraction,
        )

        if direct_options:
            first_option = direct_options[0]
            message = (
                "We found an available appointment with "
                f"{first_option.technician_name} on "
                f"{first_option.appointment_date} from "
                f"{first_option.start_time} to "
                f"{first_option.end_time}."
            )
            return AgentSchedulingResult(
                status="options_available",
                message=message,
                appointment_options=direct_options,
            )

        # If no slot for preferred_time (e.g. morning vs afternoon), try the alternate slot
        if extraction.preferred_date and extraction.service:
            alt_time = "afternoon" if extraction.preferred_time == "morning" else "morning"
            alt_extraction = extraction.model_copy()
            alt_extraction.preferred_time = alt_time
            alt_options = get_options_for_extraction(
                db=self.db,
                extraction=alt_extraction,
            )
            if alt_options:
                first_option = alt_options[0]
                message = (
                    f"We found alternative appointments on "
                    f"{first_option.appointment_date} in the {alt_time}."
                )
                return AgentSchedulingResult(
                    status="options_available",
                    message=message,
                    appointment_options=alt_options,
                )

            # If no slots remain on preferred_date (e.g. past today's hours), find the next available day
            try:
                parsed_base_date = date.fromisoformat(extraction.preferred_date)
                for day_offset in range(1, 4):
                    next_day_iso = (parsed_base_date + timedelta(days=day_offset)).isoformat()
                    for next_slot in ["morning", "afternoon"]:
                        next_extraction = extraction.model_copy()
                        next_extraction.preferred_date = next_day_iso
                        next_extraction.preferred_time = next_slot
                        next_options = get_options_for_extraction(
                            db=self.db,
                            extraction=next_extraction,
                        )
                        if next_options:
                            first_option = next_options[0]
                            message = (
                                f"No more appointment slots are available for {extraction.preferred_date}. "
                                f"We found the next available appointment on "
                                f"{first_option.appointment_date} in the {next_slot}."
                            )
                            return AgentSchedulingResult(
                                status="options_available",
                                message=message,
                                appointment_options=next_options,
                            )
            except ValueError:
                pass

        # ----------------------------------------------------
        # No availability
        # ----------------------------------------------------

        return AgentSchedulingResult(
            status="no_availability",
            message=(
                "We couldn't find an available technician "
                "for your requested service and time."
            ),
            appointment_options=[],
        )

