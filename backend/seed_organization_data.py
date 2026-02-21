
import random
import uuid
from datetime import datetime, timedelta, time
from app import create_app
from app.extensions import db
from app.models.organization import Organization
from app.models.location import Location
from app.models.camera import Camera
from app.models.department import Department
from app.models.shift import Shift
from app.models.user import User
from app.models.role import Role
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord
# Check if AttendanceChangeRequest is in attendance model or separate. 
# Based on typical patterns and previous knowledge, I will try to import it from its likely location or define a dummy if missing in context, 
# but best to try importing from app.models.attendance_change_request or app.models.attendance if it was hidden.
# Since I can't check file existence easily without a tool, I'll assume it's in a separate file or I'll skip it if import fails (safe approach).
# Actually, I'll try to import generically.
from app.models.presence_event import PresenceEvent
from app.models.visitor import OrganizationVisitor
from app.models.lpr import LPRLog
from app.models.leave_request import LeaveRequest
from werkzeug.security import generate_password_hash

# Try importing AttendanceChangeRequest
try:
    from app.models.attendance_change_request import AttendanceChangeRequest
    HAS_ACR = True
except ImportError:
    HAS_ACR = False
    print("Warning: AttendanceChangeRequest model not found. Skipping data generation for it.")

def seed_data():
    app = create_app()
    with app.app_context():
        print("Starting comprehensive data seeding for Nikki Pvt Ltd (20 Employees, 30 Days)...")

        # 0. Ensure Roles
        employee_role = Role.query.filter_by(name="employee").first()
        if not employee_role:
            employee_role = Role(name="employee", description="Standard Employee", permissions={"read": ["*"]})
            db.session.add(employee_role)
            db.session.commit()

        # 1. Organization
        org_code = "NIKKI001"
        org = Organization.query.filter_by(code=org_code).first()
        if not org:
            org = Organization(
                name="Nikki Pvt Ltd",
                code=org_code,
                organization_type="office",
                address="123 Tech Park, Innovation Way, Bangalore",
                contact_email="admin@nikki.com",
                contact_phone="+91-9876543210",
                timezone="Asia/Kolkata",
                working_hours={"start": "09:00", "end": "18:00", "days": [0, 1, 2, 3, 4]},
                enabled_features={
                    "visitor_management": True,
                    "employee_attendance": True,
                    "advanced_analytics": True,
                    "camera_integration": True,
                    "lpr_integration": True
                }
            )
            db.session.add(org)
            db.session.commit()
            print(f"Created Organization: {org.name}")
        elif org.name != "Nikki Pvt Ltd":
            org.name = "Nikki Pvt Ltd"
            db.session.commit()

        # 2. Infrastructure
        # Departments
        depts = ["Engineering", "HR", "Sales", "Marketing", "Operations"]
        dept_ids = []
        for d_name in depts:
            dept = Department.query.filter_by(organization_id=org.id, name=d_name).first()
            if not dept:
                dept = Department(organization_id=org.id, name=d_name, code=d_name[:3].upper())
                db.session.add(dept)
                db.session.commit()
            dept_ids.append(dept.id)

        # Shift
        shift = Shift.query.filter_by(organization_id=org.id, name="General").first()
        if not shift:
            shift = Shift(
                organization_id=org.id, name="General", 
                start_time=time(9, 0), end_time=time(18, 0), 
                working_days=[0, 1, 2, 3, 4]
            )
            db.session.add(shift)
            db.session.commit()

        # Location
        loc = Location.query.filter_by(organization_id=org.id, name="Main Gate").first()
        if not loc:
            loc = Location(organization_id=org.id, name="Main Gate", location_type="ENTRY")
            db.session.add(loc)
            db.session.commit()

        # Cameras (2 Cameras: Entry & Exit)
        cam_in = Camera.query.filter_by(organization_id=org.id, name="Entry Cam").first()
        if not cam_in:
            cam_in = Camera(
                organization_id=org.id, location_id=loc.id, name="Entry Cam", 
                camera_type="CHECK_IN", source_type="RTSP_STREAM", status="online"
            )
            db.session.add(cam_in)
        
        cam_out = Camera.query.filter_by(organization_id=org.id, name="Exit Cam").first()
        if not cam_out:
            cam_out = Camera(
                organization_id=org.id, location_id=loc.id, name="Exit Cam", 
                camera_type="CHECK_OUT", source_type="RTSP_STREAM", status="online"
            )
            db.session.add(cam_out)
        db.session.commit()

        # 3. Create 20 Employees
        employees = []
        for i in range(1, 21):
            email = f"emp{i}@nikki.com"
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(email=email, username=f"emp{i}_nikki", role_id=employee_role.id)
                user.password_hash = generate_password_hash("password123")
                db.session.add(user)
                db.session.flush()

                emp = Employee(
                    user_id=user.id,
                    organization_id=org.id,
                    department_id=random.choice(dept_ids),
                    employee_code=f"EMP{i:03d}",
                    full_name=f"Employee {i}",
                    gender="male" if i % 2 == 0 else "female",
                    joining_date=datetime.utcnow().date() - timedelta(days=random.randint(30, 700)),
                    designation="Associate",
                    employment_type="full_time",
                    shift_id=shift.id
                )
                db.session.add(emp)
                db.session.commit()
                employees.append(emp)
            else:
                emp = Employee.query.filter_by(user_id=user.id).first()
                if emp: employees.append(emp)
        
        print(f"Ensured {len(employees)} employees exist.")

        # 4. History (Last 30 Days)
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=30)
        current_date = start_date

        while current_date <= today:
            is_weekend = current_date.weekday() > 4
            
            # On working days, most people come. On weekends, few.
            # Target: ~20 present on weekdays.
            if is_weekend:
                present_employees = random.sample(employees, k=random.randint(2, 5))
            else:
                # 90-100% attendance
                k = random.randint(18, 20)
                present_employees = random.sample(employees, k=k)

            # --- Attendance Logs & Presence Events ---
            for emp in present_employees:
                # Check for duplicate
                existing_att = AttendanceRecord.query.filter_by(employee_id=emp.id, date=current_date).first()
                if not existing_att:
                    # Logic: 
                    # 5% Late
                    # 5% Leave Early
                    # 90% Normal
                    rand = random.random()
                    shift_start = datetime.combine(current_date, time(9, 0))
                    shift_end = datetime.combine(current_date, time(18, 0))
                    
                    status = "present"
                    check_in_time = shift_start + timedelta(minutes=random.randint(-20, 10))
                    check_out_time = shift_end + timedelta(minutes=random.randint(0, 45))
                    
                    if rand > 0.95: # Late
                        check_in_time = shift_start + timedelta(minutes=random.randint(30, 90))
                        status = "present" # Late is still present usually
                    elif rand > 0.90: # Leave Early
                        check_out_time = shift_start + timedelta(hours=5)
                        status = "half_day"

                    work_hours = (check_out_time - check_in_time).total_seconds() / 3600
                    
                    att = AttendanceRecord(
                        employee_id=emp.id,
                        organization_id=org.id,
                        camera_id=cam_in.id,
                        date=current_date,
                        check_in_time=check_in_time,
                        check_out_time=check_out_time,
                        status=status,
                        work_hours=round(work_hours, 2),
                        face_match_confidence=random.uniform(0.85, 0.99),
                        liveness_verified=True,
                        review_status="auto_approved"
                    )
                    db.session.add(att)
                    db.session.flush()

                    # 1. Entry Event (Entry Cam)
                    evt_in = PresenceEvent(
                        organization_id=org.id,
                        employee_id=emp.id,
                        camera_id=cam_in.id,
                        location_id=loc.id,
                        event_type="CHECK_IN",
                        timestamp=check_in_time,
                        confidence_score=att.face_match_confidence,
                        liveness_verified=True,
                        review_status="auto_approved",
                        attendance_record_id=att.id
                    )
                    db.session.add(evt_in)

                    # 2. Exit Event (Exit Cam)
                    evt_out = PresenceEvent(
                        organization_id=org.id,
                        employee_id=emp.id,
                        camera_id=cam_out.id,
                        location_id=loc.id,
                        event_type="CHECK_OUT",
                        timestamp=check_out_time,
                        confidence_score=random.uniform(0.85, 0.99),
                        liveness_verified=True,
                        review_status="auto_approved",
                        attendance_record_id=att.id
                    )
                    db.session.add(evt_out)

                    # Occasional attendance correction request
                    if HAS_ACR and random.random() > 0.98:
                        acr = AttendanceChangeRequest(
                            organization_id=org.id,
                            employee_id=emp.id,
                            attendance_record_id=att.id,
                            request_date=current_date,
                            request_type="time_correction",
                            requested_changes={
                                "check_in_time": (check_in_time - timedelta(minutes=15)).isoformat(),
                                "check_out_time": check_out_time.isoformat()
                            },
                            reason="forgot to punch in earlier",
                            status="pending"
                        )
                        db.session.add(acr)
            
            # --- Absentees / Leaves ---
            # Employees NOT in present_employees are absent
            absent_employees = [e for e in employees if e not in present_employees]
            if not is_weekend:
                for emp in absent_employees:
                    # 40% chance they applied for leave
                    if random.random() < 0.4:
                        existing_leave = LeaveRequest.query.filter_by(employee_id=emp.id, start_date=current_date).first()
                        if not existing_leave:
                            leave_type = random.choice(["sick", "casual", "privilege"])
                            l_status = random.choice(["approved", "pending"])
                            lr = LeaveRequest(
                                employee_id=emp.id,
                                organization_id=org.id,
                                leave_type=leave_type,
                                start_date=current_date,
                                end_date=current_date,
                                total_days=1.0,
                                reason=f"{leave_type} leave",
                                status=l_status,
                                approved_by=employees[0].user_id if l_status == "approved" else None
                            )
                            db.session.add(lr)

            # --- Visitors (10-15 per day) ---
            num_visitors = random.randint(10, 15)
            for v in range(num_visitors):
                v_start = datetime.combine(current_date, time(random.randint(9, 16), random.randint(0, 59)))
                v_end = v_start + timedelta(minutes=random.randint(20, 120))
                
                vis = OrganizationVisitor(
                    organization_id=org.id,
                    visitor_name=f"Visitor {v}-{current_date.day}",
                    mobile_number=f"+91-998800{random.randint(1000, 9999)}",
                    email=f"vis{v}{current_date.day}@example.com",
                    purpose_of_visit=random.choice(["Meeting", "Vendor", "Interview"]),
                    allowed_floor="1st Floor",
                    visitor_type="guest",
                    check_in_time=v_start,
                    check_out_time=v_end,
                    is_checked_in=False,
                    host_name=random.choice(employees).full_name,
                    badge_number=f"BADGE-{current_date.day}-{v}",
                    created_at=v_start
                )
                db.session.add(vis)

            # --- LPR Logs (10-12 per day) ---
            for l in range(random.randint(10, 12)):
                lpr_time = datetime.combine(current_date, time(random.randint(8, 20), random.randint(0, 59)))
                lpr = LPRLog(
                    organization_id=org.id,
                    vehicle_number=f"KA{random.randint(10,99)}Z{random.randint(1000,9999)}",
                    direction=random.choice(["entry", "exit"]),
                    timestamp=lpr_time,
                    gate_name="Main Gate",
                    camera_id=random.choice([cam_in.id, cam_out.id]),
                    status="allowed",
                    category="visitor",
                    confidence_score=0.95
                )
                db.session.add(lpr)

            db.session.commit()
            print(f"Processed {current_date}")
            current_date += timedelta(days=1)

        print("Data seeding completed!")

if __name__ == "__main__":
    seed_data()
