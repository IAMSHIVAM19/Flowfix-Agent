"""
Seeds realistic showcase requests, appointments, and customer records for demo & evaluation.
"""
import uuid
from datetime import date, timedelta
from sqlalchemy import select
from .database import SessionLocal
from .models import RequestStatus, RequestUrgency
from .models_db import (
    Appointment,
    Customer,
    Notification,
    ServiceRequest,
    ServiceRequestMessage,
    Technician,
)


def seed_showcase_data(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Check if service requests already exist
        existing_count = db.scalar(select(ServiceRequest.id).limit(1))
        if existing_count is not None:
            return

        techs = {t.name: t.id for t in db.query(Technician).all()}
        if not techs:
            return

        today = date.today()
        tomorrow = today + timedelta(days=1)
        day_after = today + timedelta(days=2)
        friday = today + timedelta(days=3)

        customers_data = [
            {
                "key": "marcus",
                "name": "Marcus Vance",
                "phone": "0418 234 890",
                "address": "42 Ocean Street, Bondi NSW 2026",
            },
            {
                "key": "elena",
                "name": "Elena Rostova",
                "phone": "0432 876 543",
                "address": "88 Crown Street, Surry Hills NSW 2010",
            },
            {
                "key": "liam",
                "name": "Liam Henderson",
                "phone": "0421 998 123",
                "address": "15 Military Road, Neutral Bay NSW 2089",
            },
            {
                "key": "chloe",
                "name": "Chloe Davis",
                "phone": "0415 654 321",
                "address": "27 Harbour View Crescent, Mosman NSW 2088",
            },
            {
                "key": "nathan",
                "name": "Nathan Brooks",
                "phone": "0404 112 334",
                "address": "19 Albert Street, Paddington NSW 2021",
            },
            {
                "key": "sophia",
                "name": "Sophia Martinez",
                "phone": "0429 883 774",
                "address": "55 Darlinghurst Road, Potts Point NSW 2011",
            },
            {
                "key": "lucas",
                "name": "Lucas Wright",
                "phone": "0411 776 225",
                "address": "304 Victoria Road, Gladesville NSW 2111",
            },
            {
                "key": "danielle",
                "name": "Danielle Cooper",
                "phone": "0408 332 991",
                "address": "12 Macquarie Street, Parramatta NSW 2150",
            },
        ]

        cust_objs = {}
        for c in customers_data:
            existing_cust = db.scalar(select(Customer).where(Customer.phone == c["phone"]))
            if existing_cust is None:
                existing_cust = Customer(name=c["name"], phone=c["phone"], address=c["address"])
                db.add(existing_cust)
                db.flush()
            cust_objs[c["key"]] = existing_cust

        requests_data = [
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "marcus",
                "message": "Major burst copper pipe in downstairs garage spraying water directly over the breaker panel. We have isolated the main valve at the meter but water is pooled everywhere and we need an emergency licensed plumber urgently.",
                "issue": "Burst copper pipe spraying water in garage",
                "service": "burst pipe repair",
                "urgency": RequestUrgency.HIGH,
                "preferred_date": today.isoformat(),
                "preferred_time": "09:00 - 12:00",
                "status": RequestStatus.CONFIRMED,
                "appointment": {
                    "tech_name": "John",
                    "date": today.isoformat(),
                    "start": "09:00",
                    "end": "12:00",
                },
                "messages": [
                    ("customer", "Major burst copper pipe in garage spraying water near breaker panel. Isolated main valve, urgent dispatch requested."),
                    ("assistant", f"Emergency detected for burst pipe repair. High-priority dispatch confirmed with specialist John for {today.strftime('%A %d %B')} (09:00 - 12:00)."),
                ],
            },
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "elena",
                "message": "Strong natural gas odor detected behind commercial range cooker in our café kitchen. Supply valve shut off as precaution. Certified gas fitter required for leak detection, pressure testing and bayonet re-sealing.",
                "issue": "Natural gas odor behind commercial range cooker",
                "service": "gas fitting",
                "urgency": RequestUrgency.HIGH,
                "preferred_date": today.isoformat(),
                "preferred_time": "13:00 - 17:00",
                "status": RequestStatus.CONFIRMED,
                "appointment": {
                    "tech_name": "Ben",
                    "date": today.isoformat(),
                    "start": "13:00",
                    "end": "17:00",
                },
                "messages": [
                    ("customer", "Strong natural gas odor behind commercial range cooker. Gas shut off, need licensed gas fitter."),
                    ("assistant", f"Urgent gas fitting specialist booked. Ben is scheduled for today {today.strftime('%A %d %B')} (13:00 - 17:00)."),
                ],
            },
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "liam",
                "message": "Ensuite mixer tap leaking heavily under the vanity cupboard, pooling water on the tiles. Mixer cartridge needs replacement or full tap set upgrade.",
                "issue": "Vanity mixer tap leaking under cupboard",
                "service": "tap repair",
                "urgency": RequestUrgency.NORMAL,
                "preferred_date": tomorrow.isoformat(),
                "preferred_time": "09:00 - 12:00",
                "status": RequestStatus.CONFIRMED,
                "appointment": {
                    "tech_name": "Alex",
                    "date": tomorrow.isoformat(),
                    "start": "09:00",
                    "end": "12:00",
                },
                "messages": [
                    ("customer", "Vanity mixer tap leaking under cupboard, pooling water."),
                    ("assistant", f"Tap repair service confirmed. Specialist Alex will attend {tomorrow.strftime('%A %d %B')} (09:00 - 12:00)."),
                ],
            },
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "chloe",
                "message": "Active rainwater leak entering through second-story ceiling plenum during recent downpours. Water dripping near recessed downlights. Require roof plumbing specialist to inspect flashing, box gutters, and roof penetration seals.",
                "issue": "Rainwater leak from roof flashing into second-story ceiling",
                "service": "roof plumbing",
                "urgency": RequestUrgency.NORMAL,
                "preferred_date": tomorrow.isoformat(),
                "preferred_time": "13:00 - 17:00",
                "status": RequestStatus.CONFIRMED,
                "appointment": {
                    "tech_name": "Sarah",
                    "date": tomorrow.isoformat(),
                    "start": "13:00",
                    "end": "17:00",
                },
                "messages": [
                    ("customer", "Active ceiling rainwater leak near downlights from box gutter/flashing."),
                    ("assistant", f"Roof plumbing appointment confirmed with certified specialist Sarah for {tomorrow.strftime('%A %d %B')} (13:00 - 17:00)."),
                ],
            },
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "nathan",
                "message": "Rheem storage hot water tank is leaking from bottom casing and tripping electrical safety switch. Lukewarm water only. Need diagnosis and replacement of heating element or full storage system replacement.",
                "issue": "Rheem hot water system leaking and tripping circuit",
                "service": "hot water system",
                "urgency": RequestUrgency.HIGH,
                "preferred_date": day_after.isoformat(),
                "preferred_time": "09:00 - 12:00",
                "status": RequestStatus.CONFIRMED,
                "appointment": {
                    "tech_name": "Alex",
                    "date": day_after.isoformat(),
                    "start": "09:00",
                    "end": "12:00",
                },
                "messages": [
                    ("customer", "Rheem hot water system leaking from base and tripping circuit switch."),
                    ("assistant", f"Hot water system replacement appointment confirmed with Alex for {day_after.strftime('%A %d %B')} (09:00 - 12:00)."),
                ],
            },
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "sophia",
                "message": "Flooding under kitchen island cabinetry from loose dishwasher inlet hose. Floorboards swelling, main stop-cock is very stiff. Need emergency dispatch right away.",
                "issue": "Kitchen island flooding from loose dishwasher inlet hose",
                "service": "burst pipe repair",
                "urgency": RequestUrgency.HIGH,
                "preferred_date": today.isoformat(),
                "preferred_time": "13:00 - 17:00",
                "status": RequestStatus.AWAITING_APPOINTMENT_SELECTION,
                "appointment": None,
                "messages": [
                    ("customer", "Flooding under kitchen island from loose dishwasher inlet. Urgent dispatch needed this afternoon."),
                    ("assistant", "We have prioritized your emergency request and prepared dispatch options with qualified technicians. Please select your preferred arrival window or our operations dispatcher can book on your behalf."),
                ],
            },
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "lucas",
                "message": "Water staining appearing along corridor wall adjacent to the master ensuite. No visible pipe exposed, but wall plaster feels damp and paint is bubbling.",
                "issue": "Concealed pipe leak causing dampness and corridor wall staining",
                "service": "leak investigation",
                "urgency": RequestUrgency.NORMAL,
                "preferred_date": None,
                "preferred_time": None,
                "status": RequestStatus.AWAITING_INFORMATION,
                "appointment": None,
                "messages": [
                    ("customer", "Water staining appearing along corridor wall adjacent to master ensuite."),
                    ("assistant", "We've identified this as a leak investigation. Before we can schedule an acoustic leak detection specialist, could you please let us know your preferred date and whether morning or afternoon works best?"),
                ],
            },
            {
                "req_uuid": str(uuid.uuid4()),
                "cust_key": "danielle",
                "message": "Annual mandatory backflow prevention containment device testing and certification required by Sydney Water for commercial premises. Form 4 compliance submission needed.",
                "issue": "Annual commercial backflow prevention compliance testing",
                "service": "backflow prevention",
                "urgency": RequestUrgency.LOW,
                "preferred_date": friday.isoformat(),
                "preferred_time": "09:00 - 12:00",
                "status": RequestStatus.AWAITING_APPOINTMENT_SELECTION,
                "appointment": None,
                "messages": [
                    ("customer", "Annual mandatory backflow prevention test for commercial unit. Friday morning preferred."),
                    ("assistant", "Backflow prevention compliance inspection registered. Available slots have been matched with certified technician Sarah."),
                ],
            },
        ]

        for req_data in requests_data:
            cust = cust_objs[req_data["cust_key"]]
            sr = ServiceRequest(
                request_id=req_data["req_uuid"],
                customer_id=cust.id,
                message=req_data["message"],
                issue=req_data["issue"],
                service=req_data["service"],
                urgency=req_data["urgency"],
                preferred_date=req_data["preferred_date"],
                preferred_time=req_data["preferred_time"],
                status=req_data["status"],
            )
            db.add(sr)
            db.flush()

            if req_data.get("appointment"):
                app_info = req_data["appointment"]
                tech_id = techs.get(app_info["tech_name"])
                if tech_id:
                    app = Appointment(
                        service_request_id=sr.id,
                        technician_id=tech_id,
                        appointment_date=app_info["date"],
                        start_time=app_info["start"],
                        end_time=app_info["end"],
                        status="confirmed",
                    )
                    db.add(app)
                    db.flush()

                    notif = Notification(
                        service_request_id=sr.id,
                        recipient_type="customer",
                        notification_type="sms_booking_confirmed",
                        message=f"FlowFix: Your {req_data['service']} has been confirmed with {app_info['tech_name']} on {app_info['date']} between {app_info['start']} and {app_info['end']}.",
                        status="sent",
                    )
                    db.add(notif)

            for role, msg_text in req_data.get("messages", []):
                srm = ServiceRequestMessage(
                    service_request_id=sr.id,
                    role=role,
                    message=msg_text,
                )
                db.add(srm)

        db.commit()
        print("Showcase requests, appointments, and notifications seeded successfully.")
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_showcase_data()
