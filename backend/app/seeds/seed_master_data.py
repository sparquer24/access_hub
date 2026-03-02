"""
Comprehensive Master/Test Data Seeding Script for Single Organization
Creates roles with permissions, one primary organization, departments, employees, shifts, test users,
and 2 months of detailed attendance logs for testing and analytics.
"""

import sys
import os
from datetime import datetime, timedelta, date, time
from dotenv import load_dotenv

# Add the project root to sys.path if running as a script
if __name__ == "__main__":
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from app import create_app
from app.extensions import db, bcrypt
from app.models import (
    Role, Organization, Department, Employee, User, Shift, AttendanceRecord,
    Location, Camera, LeaveRequest, OrganizationVisitor, VisitorHistoryDetails
)
import uuid


def create_roles():
    """Create comprehensive role structure with detailed permissions"""
    
    print("\n--- Creating Roles ---")
    
    roles_data = [
        {
            "name": "super_admin",
            "description": "Super Administrator with full system access",
            "permissions": {
                "organizations": ["create", "read", "update", "delete"],
                "departments": ["create", "read", "update", "delete"],
                "employees": ["create", "read", "update", "delete"],
                "users": ["create", "read", "update", "delete"],
                "roles": ["create", "read", "update", "delete"],
                "attendance": ["create", "read", "update", "delete", "approve"],
                "leaves": ["create", "read", "update", "delete", "approve"],
                "shifts": ["create", "read", "update", "delete"],
                "visitors": ["create", "read", "update", "delete", "checkin", "checkout", "movement", "search"],
                "analytics": ["read"],
                "settings": ["read", "update"],
                "*": ["*"],  # Super admin can do everything
            }
        },
        {
            "name": "org_admin",
            "description": "Organization Administrator with access to own organization",
            "permissions": {
                "organizations": ["read"],
                "departments": ["create", "read", "update", "delete"],
                "employees": ["create", "read", "update", "delete"],
                "users": ["create", "read", "update"],
                "attendance": ["read", "update", "approve"],
                "leaves": ["read", "approve"],
                "shifts": ["create", "read", "update", "delete"],
                "visitors": ["create", "read", "update", "delete", "checkin", "checkout"],
                "cameras": ["read"],
                "locations": ["read"],
                "analytics": ["read"],
                "settings": ["read", "update"],
            }
        },
        {
            "name": "manager",
            "description": "Department Manager - Team management and attendance approval",
            "permissions": {
                "departments": ["read"],
                "employees": ["read", "update"],
                "users": ["read"],
                "attendance": ["read", "update", "approve"],
                "leaves": ["read", "approve", "reject"],
                "shifts": ["read"],
                "analytics": ["read"],
                "team_reports": ["read"],
                "profile": ["read", "update"],
            }
        },
        {
            "name": "team_lead",
            "description": "Team Lead - Limited management access",
            "permissions": {
                "employees": ["read"],
                "attendance": ["read", "update"],
                "leaves": ["read"],
                "shifts": ["read"],
                "analytics": ["read"],
                "team_reports": ["read"],
                "profile": ["read", "update"],
            }
        },
        {
            "name": "employee",
            "description": "Regular Employee - Basic access to own records",
            "permissions": {
                "attendance": ["create", "read"],
                "leaves": ["create", "read"],
                "profile": ["read", "update"],
            }
        },
        {
            "name": "visitor",
            "description": "Visitor - Check-in/out access",
            "permissions": {
                "visitors": ["checkin", "checkout"],
                "profile": ["read"],
            }
        }
    ]
    
    created_roles = []
    
    for role_data in roles_data:
        existing_role = Role.query.filter_by(name=role_data["name"]).first()
        
        if existing_role:
            print(f"  [INFO] Role already exists: {role_data['name']}")
            created_roles.append(existing_role)
        else:
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
                permissions=role_data["permissions"]
            )
            db.session.add(role)
            db.session.flush()
            print(f"  [SUCCESS] Created role: {role_data['name']}")
            created_roles.append(role)
    
    return {role.name: role for role in created_roles}


def create_organizations():
    """Create primary test organizations"""
    
    print("\n--- Creating Organizations ---")
    
    organizations_data = [
        {
            "name": "India IT Park",
            "code": "IIT",
            "organization_type": "office",
            "address": "789 IT Boulevard, Hyderabad, India",
            "contact_email": "contact@indiaittpark.com",
            "contact_phone": "+91-40-2331-0000",
            "timezone": "Asia/Kolkata",
            "subscription_tier": "premium",
        },
        {
            "name": "nikki",
            "code": "NIKKI_HYD",
            "organization_type": "office",
            "address": "hyd",
            "contact_email": "admin@nikki.com",
            "contact_phone": "+91-1234567890",
            "timezone": "Asia/Kolkata",
            "subscription_tier": "basic",
        }
    ]
    
    created_orgs = []
    
    for org_data in organizations_data:
        existing_org = Organization.query.filter_by(code=org_data["code"]).first()
        
        if existing_org:
            print(f"  [INFO] Organization already exists: {org_data['name']}")
            created_orgs.append(existing_org)
        else:
            org = Organization(
                name=org_data["name"],
                code=org_data["code"],
                organization_type=org_data["organization_type"],
                address=org_data["address"],
                contact_email=org_data["contact_email"],
                contact_phone=org_data["contact_phone"],
                timezone=org_data["timezone"],
                subscription_tier=org_data["subscription_tier"],
                working_hours={
                    "start": "09:00",
                    "end": "18:00",
                    "days": [1, 2, 3, 4, 5]  # Monday to Friday
                },
                is_active=True
            )
            db.session.add(org)
            db.session.flush()
            print(f"  [SUCCESS] Created organization: {org_data['name']}")
            created_orgs.append(org)
    
    return created_orgs


def create_departments(organizations):
    """Create departments for organizations"""
    
    print("\n--- Creating Departments ---")
    
    departments_structure = {
        "Engineering": "Department for all engineering work",
        "Sales": "Sales and business development",
        "HR": "Human Resources",
        "Finance": "Finance and accounting",
        "Operations": "Operations management",
        "Support": "Customer support",
    }
    
    created_depts = []
    
    for org in organizations:
        print(f"\n  Creating departments for {org.name}:")
        
        for idx, (dept_name, dept_desc) in enumerate(departments_structure.items(), 1):
            dept_code = f"{dept_name.upper()[:3]}"  # First 3 letters
            
            existing_dept = Department.query.filter_by(
                organization_id=org.id,
                code=dept_code
            ).first()
            
            if existing_dept:
                print(f"    [INFO] Department already exists: {dept_name}")
                created_depts.append(existing_dept)
            else:
                dept = Department(
                    organization_id=org.id,
                    name=dept_name,
                    code=dept_code,
                    description=dept_desc,
                    is_active=True
                )
                db.session.add(dept)
                db.session.flush()
                print(f"    [SUCCESS] Created department: {dept_name}")
                created_depts.append(dept)
    
    return created_depts


def create_shifts(organizations):
    """Create work shifts for organizations"""
    
    print("\n--- Creating Shifts ---")
    
    shifts_data = [
        {
            "name": "Morning Shift",
            "start_time": "09:00",
            "end_time": "17:00",
            "grace_period_minutes": 15,
            "working_days": [1, 2, 3, 4, 5],  # Monday to Friday
        },
        {
            "name": "Evening Shift",
            "start_time": "14:00",
            "end_time": "22:00",
            "grace_period_minutes": 15,
            "working_days": [1, 2, 3, 4, 5],
        },
        {
            "name": "Night Shift",
            "start_time": "22:00",
            "end_time": "06:00",
            "grace_period_minutes": 15,
            "working_days": [1, 2, 3, 4, 5],
        },
        {
            "name": "Weekend Shift",
            "start_time": "10:00",
            "end_time": "18:00",
            "grace_period_minutes": 20,
            "working_days": [5, 6],  # Friday to Saturday
        },
    ]
    
    created_shifts = []
    
    for org in organizations:
        print(f"\n  Creating shifts for {org.name}:")
        
        for shift_data in shifts_data:
            existing_shift = Shift.query.filter_by(
                organization_id=org.id,
                name=shift_data["name"]
            ).first()
            
            if existing_shift:
                print(f"    [INFO] Shift already exists: {shift_data['name']}")
                created_shifts.append(existing_shift)
            else:
                shift = Shift(
                    organization_id=org.id,
                    name=shift_data["name"],
                    start_time=datetime.strptime(shift_data["start_time"], "%H:%M").time(),
                    end_time=datetime.strptime(shift_data["end_time"], "%H:%M").time(),
                    grace_period_minutes=shift_data["grace_period_minutes"],
                    working_days=shift_data["working_days"],
                    is_active=True
                )
                db.session.add(shift)
                db.session.flush()
                print(f"    [SUCCESS] Created shift: {shift_data['name']}")
                created_shifts.append(shift)
    
    return created_shifts


def create_super_admin_user(roles):
    """Create super admin user with system-wide access"""
    
    print("\n--- Creating Super Admin User ---")
    
    super_admin_data = {
        "email": "superadmin@accesshub.com",
        "username": "superadmin",
        "full_name": "Super Administrator",
        "organization_id": None,  # Super admin doesn't belong to specific org
    }
    
    # Check if super admin already exists
    existing_super_admin = User.query.filter_by(email=super_admin_data["email"]).first()
    
    if existing_super_admin:
        print(f"  [INFO] Super admin already exists: {super_admin_data['email']}")
        return existing_super_admin
    
    # Get super_admin role
    super_admin_role = roles.get("super_admin")
    if not super_admin_role:
        print("  [ERROR] super_admin role not found!")
        return None
    
    # Create super admin user
    super_admin_user = User(
        email=super_admin_data["email"],
        username=super_admin_data["username"],
        password_hash=bcrypt.generate_password_hash("SuperAdmin@123").decode('utf-8'),
        role_id=super_admin_role.id,
        organization_id=super_admin_data["organization_id"],
        is_active=True
    )
    db.session.add(super_admin_user)
    db.session.flush()
    
    print(f"  [SUCCESS] Created super admin user: {super_admin_data['email']}")
    print(f"    - Username: {super_admin_data['username']}")
    print(f"    - Password: SuperAdmin@123")
    print(f"    - Full Name: {super_admin_data['full_name']}")
    
    return super_admin_user


def create_users_and_employees(organizations, departments, roles, shifts):
    """Create test users and linked employees for organizations"""
    
    print("\n--- Creating Users and Employees ---")
    
    # Base employees data template
    base_employees_data = [
        # Engineering Department
        {
            "dept_code": "ENG",
            "full_name": "Priya Sharma",
            "email_template": "priya.sharma@{domain}",
            "username_template": "priya_sharma_{org_code}",
            "employee_code_template": "{org_code}001",
            "designation": "Senior Developer",
            "gender": "female",
            "role": "manager",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "ENG",
            "full_name": "Rajesh Kumar",
            "email_template": "rajesh.kumar@{domain}",
            "username_template": "rajesh_kumar_{org_code}",
            "employee_code_template": "{org_code}002",
            "designation": "Developer",
            "gender": "male",
            "role": "team_lead",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "HR",
            "full_name": "Divya Nair",
            "email_template": "divya.nair@{domain}",
            "username_template": "divya_nair_{org_code}",
            "employee_code_template": "{org_code}009",
            "designation": "HR Manager",
            "gender": "female",
            "role": "manager",
            "shift_name": "Morning Shift",
        }
    ]
    
    created_users = []
    created_employees = []
    
    for org in organizations:
        print(f"\n  Creating users and employees for {org.name}:")
        domain = f"{org.name.lower().replace(' ', '')}.com"
        
        for emp_data in base_employees_data:
            # Find department
            dept = next((d for d in departments if d.organization_id == org.id and d.code == emp_data["dept_code"]), None)
            if not dept:
                print(f"    [WARNING] Department {emp_data['dept_code']} not found, skipping employee {emp_data['full_name']}")
                continue
            
            # Find shift
            shift = next((s for s in shifts if s.organization_id == org.id and s.name == emp_data["shift_name"]), None)
            
            # Find role
            role = roles.get(emp_data["role"])
            if not role:
                print(f"    [WARNING] Role {emp_data['role']} not found, skipping employee {emp_data['full_name']}")
                continue
            
            email = emp_data["email_template"].format(domain=domain)
            username = emp_data["username_template"].format(org_code=org.code.lower())
            emp_code = emp_data["employee_code_template"].format(org_code=org.code)
            
            # Check if user already exists
            existing_user = User.query.filter_by(email=email).first()
            
            if existing_user:
                print(f"    [INFO] User already exists: {emp_data['full_name']} ({email})")
                created_users.append(existing_user)
                
                # Link employee if not already linked
                employee = Employee.query.filter_by(user_id=existing_user.id).first()
                if employee:
                    created_employees.append(employee)
            else:
                # Create user
                user = User(
                    email=email,
                    username=username,
                    password_hash=bcrypt.generate_password_hash("Test@123").decode('utf-8'),
                    role_id=role.id,
                    organization_id=org.id,
                    is_active=True
                )
                db.session.add(user)
                db.session.flush()
                print(f"    [SUCCESS] Created user: {emp_data['full_name']} (Role: {role.name})")
                created_users.append(user)
                
                # Create employee linked to user
                employee = Employee(
                    user_id=user.id,
                    organization_id=org.id,
                    department_id=dept.id,
                    employee_code=emp_code,
                    full_name=emp_data["full_name"],
                    designation=emp_data["designation"],
                    gender=emp_data["gender"],
                    employment_type="full_time",
                    shift_id=shift.id if shift else None,
                    joining_date=date.today() - timedelta(days=365),  # 1 year ago
                    is_active=True
                )
                db.session.add(employee)
                db.session.flush()
                print(f"      [SUCCESS] Created employee: {emp_data['full_name']}")
                created_employees.append(employee)
    
    return created_users, created_employees


def create_attendance_records(employees):
    """Create sample attendance records for the last 2 months (60 days)"""
    
    print("\n--- Creating Sample Attendance Records (Last 2 Months) ---")
    
    if not employees:
        print("  [WARNING] No employees found to create attendance records")
        return
    
    today = date.today()
    total_records_created = 0
    
    import random
    
    for employee in employees:
        print(f"\n  Creating attendance for: {employee.full_name} ({employee.employee_code})")
        employee_records = 0
        
        # Create records for last 60 days (2 months)
        for days_ago in range(60, 0, -1):
            record_date = today - timedelta(days=days_ago)
            
            # Skip weekends (Saturday=5, Sunday=6)
            if record_date.weekday() >= 5:
                continue
            
            pattern = random.random()
            
            if pattern < 0.75:  # 75% present
                status_choice = "present"
            elif pattern < 0.90:  # 15% half_day
                status_choice = "half_day"
            else:  # 10% absent
                status_choice = "absent"
            
            existing_record = AttendanceRecord.query.filter_by(
                employee_id=employee.id,
                date=record_date
            ).first()
            
            if existing_record:
                continue
            
            # Create attendance record based on status
            if status_choice == "present":
                # Add slight variation to check-in times (5-20 mins variance)
                variance = random.randint(5, 20)
                check_in = datetime.combine(record_date, time(9, variance))
                check_out = datetime.combine(record_date, time(17, 45))
                work_hours = 8.5
            elif status_choice == "half_day":
                check_in = datetime.combine(record_date, time(9, 15))
                check_out = datetime.combine(record_date, time(13, 0))
                work_hours = 4.0
            else:  # absent
                check_in = None
                check_out = None
                work_hours = 0.0
            
            attendance = AttendanceRecord(
                employee_id=employee.id,
                organization_id=employee.organization_id,
                date=record_date,
                check_in_time=check_in,
                check_out_time=check_out,
                status=status_choice,
                work_hours=work_hours
            )
            db.session.add(attendance)
            employee_records += 1
            total_records_created += 1
        
        print(f"    [SUCCESS] Created {employee_records} attendance records")
    
    db.session.flush()
    print(f"\n  [SUCCESS] Total Attendance Records Created: {total_records_created}")


def create_locations(organizations):
    """Create physical locations/entry points for organizations"""
    
    print("\n--- Creating Locations ---")
    
    locations_data = [
        {
            "name": "Main Gate",
            "location_type": "BOTH",
            "description": "Main entrance/exit point",
            "building": "Main Building",
            "floor": "Ground Floor",
            "area": "Reception Area",
            "latitude": 17.3850,
            "longitude": 78.4867,
        },
        {
            "name": "Tower A Entry",
            "location_type": "ENTRY",
            "description": "Tower A entrance for employees",
            "building": "Tower A",
            "floor": "Ground Floor",
            "area": "North Side",
            "latitude": 17.3851,
            "longitude": 78.4868,
        },
    ]
    
    created_locations = []
    
    for org in organizations:
        print(f"\n  Creating locations for {org.name}:")
        for loc_data in locations_data:
            existing_loc = Location.query.filter_by(
                organization_id=org.id,
                name=loc_data["name"]
            ).first()
            
            if existing_loc:
                print(f"    [INFO] Location already exists: {loc_data['name']}")
                created_locations.append(existing_loc)
            else:
                location = Location(
                    organization_id=org.id,
                    name=loc_data["name"],
                    location_type=loc_data["location_type"],
                    description=loc_data["description"],
                    building=loc_data["building"],
                    floor=loc_data["floor"],
                    area=loc_data["area"],
                    latitude=loc_data["latitude"],
                    longitude=loc_data["longitude"],
                    is_active=True
                )
                db.session.add(location)
                db.session.flush()
                print(f"    [SUCCESS] Created location: {loc_data['name']}")
                created_locations.append(location)
    
    return created_locations


def create_cameras(organizations, locations):
    """Create camera configurations for locations"""
    
    print("\n--- Creating Cameras ---")
    
    if not locations:
        print("  [WARNING] No locations found to associate cameras")
        return []
    
    cameras_config = [
        {
            "location_name": "Main Gate",
            "cameras": [
                {
                    "name": "Main Gate Check-In Cam",
                    "camera_type": "CHECK_IN",
                    "source_type": "IP_CAMERA",
                    "source_url": "192.168.1.100",
                },
                {
                    "name": "Main Gate Check-Out Cam",
                    "camera_type": "CHECK_OUT",
                    "source_type": "IP_CAMERA",
                    "source_url": "192.168.1.101",
                },
            ]
        }
    ]
    
    created_cameras = []
    
    for org in organizations:
        print(f"\n  Creating cameras for {org.name}:")
        # Filter locations for this org
        org_locations = [l for l in locations if l.organization_id == org.id]
        
        for config in cameras_config:
            # Find location
            location = next((l for l in org_locations if l.name == config["location_name"]), None)
            if not location:
                print(f"    [WARNING] Location not found: {config['location_name']}")
                continue
            
            for cam_data in config["cameras"]:
                existing_cam = Camera.query.filter_by(
                    organization_id=org.id,
                    location_id=location.id,
                    name=cam_data["name"]
                ).first()
                
                if existing_cam:
                    print(f"      [INFO] Camera already exists: {cam_data['name']}")
                    created_cameras.append(existing_cam)
                else:
                    camera = Camera(
                        organization_id=org.id,
                        location_id=location.id,
                        name=cam_data["name"],
                        camera_type=cam_data["camera_type"],
                        source_type=cam_data["source_type"],
                        source_url=cam_data["source_url"],
                        is_active=True
                    )
                    db.session.add(camera)
                    db.session.flush()
                    print(f"      [SUCCESS] Created camera: {cam_data['name']} at {config['location_name']}")
                    created_cameras.append(camera)
    
    return created_cameras


def create_leave_requests(users, employees):
    """Create sample leave requests for testing"""
    
    print("\n--- Creating Sample Leave Requests ---")
    
    leave_types = ["casual", "sick", "earned", "unpaid"]
    today = date.today()
    
    # Create leave requests for managers only (they can approve leaves)
    managers = [emp for emp in employees if emp.user and emp.user.role and "manager" in emp.user.role.name.lower()]
    
    sample_leaves = []
    for idx, employee in enumerate(employees[:10], 1):  # Create leaves for first 10 employees
        # Random leave type
        import random
        leave_type = random.choice(leave_types[:3])  # casual, sick, earned
        
        # Future leave dates (next 2 months)
        start_offset = random.randint(5, 20)
        duration = random.randint(1, 5)
        
        start_date = today + timedelta(days=start_offset)
        end_date = start_date + timedelta(days=duration)
        
        # Skip weekends
        while start_date.weekday() >= 5:
            start_date += timedelta(days=1)
        
        end_date = start_date + timedelta(days=duration)
        
        # Find a manager to approve
        approver = random.choice(managers) if managers else None
        status = random.choice(["pending", "approved", "rejected"])
        
        existing_leave = LeaveRequest.query.filter_by(
            employee_id=employee.id,
            start_date=start_date,
            end_date=end_date
        ).first()
        
        if existing_leave:
            continue
        
        leave_request = LeaveRequest(
            employee_id=employee.id,
            organization_id=employee.organization_id,
            leave_type=leave_type,
            duration_type="full_day",
            start_date=start_date,
            end_date=end_date,
            total_days=float(duration),
            reason=f"Sample {leave_type.replace('_', ' ').title()} Leave Request",
            status=status,
            approved_by=approver.user_id if approver and approver.user else None,
            approval_notes="Sample leave request created during seeding" if status != "pending" else None
        )
        db.session.add(leave_request)
        sample_leaves.append(leave_request)
    
    db.session.flush()
    print(f"  [SUCCESS] Created {len(sample_leaves)} sample leave requests")
    
    return sample_leaves



def create_visitors(organizations, employees):
    """Create dummy visitors and their history for 'nikki' organization"""
    
    print("\n--- Creating Dummy Visitors ---")
    
    # Find nikki organization
    nikki_org = next((o for o in organizations if o.name == "nikki"), None)
    if not nikki_org:
        print("  [WARNING] 'nikki' organization not found, skipping visitor seeding")
        return []
        
    # Find some employees to act as hosts for nikki
    nikki_employees = [e for e in employees if e.organization_id == nikki_org.id]
    if not nikki_employees:
        print("  [WARNING] No employees found for 'nikki', skipping visitor seeding")
        return []
        
    visitor_data = [
        {"name": "Amit Kumar", "phone": "+91-9000000001", "email": "amit@example.com", "gender": "male"},
        {"name": "Priya Sharma", "phone": "+91-9000000002", "email": "priya@example.com", "gender": "female"},
        {"name": "John Doe", "phone": "+91-9000000003", "email": "john@example.com", "gender": "male"},
        {"name": "Sneha Reddy", "phone": "+91-9000000004", "email": "sneha@example.com", "gender": "female"},
        {"name": "Rahul Verma", "phone": "+91-9000000005", "email": "rahul@example.com", "gender": "male"}
    ]

    purposes = ["Meeting", "Interview", "Delivery", "Personal", "Maintenance"]
    floors = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"]

    today = date.today()
    created_visitors = []
    
    import random

    for data in visitor_data:
        # Check if visitor already exists
        visitor = OrganizationVisitor.query.filter_by(organization_id=nikki_org.id, phone=data["phone"]).first()
        if not visitor:
            visitor = OrganizationVisitor(
                organization_id=nikki_org.id,
                name=data["name"],
                phone=data["phone"],
                email=data["email"],
                gender=data["gender"]
            )
            db.session.add(visitor)
            db.session.flush()
            print(f"  [SUCCESS] Created visitor: {visitor.name}")
        else:
            print(f"  [INFO] Visitor already exists: {data['name']}")
            
        created_visitors.append(visitor)

        # Create some history for each visitor
        # Past visit
        past_date = today - timedelta(days=random.randint(1, 10))
        host = random.choice(nikki_employees)
        
        # Check if history already exists for this visitor and date
        existing_history = VisitorHistoryDetails.query.filter_by(
            visitor_id=visitor.id,
            from_date=past_date
        ).first()
        
        if not existing_history:
            history1 = VisitorHistoryDetails(
                visitor_id=visitor.id,
                organization_id=nikki_org.id,
                visitor_type=random.choice(["guest", "contractor", "vendor"]),
                host_name=host.full_name,
                host_number="+91-9876543210",
                purpose_of_visit=random.choice(purposes),
                allowed_floor=random.choice(floors),
                from_date=past_date,
                to_date=past_date,
                check_in_time=datetime.combine(past_date, time(random.randint(9, 11), random.randint(0, 59))),
                check_out_time=datetime.combine(past_date, time(random.randint(14, 17), random.randint(0, 59))),
                is_checked_in=False
            )
            db.session.add(history1)
            print(f"    - Added past visit history for {visitor.name}")

        # Current or upcoming visit
        visit_date = today if random.random() > 0.5 else today + timedelta(days=1)
        existing_future = VisitorHistoryDetails.query.filter_by(
            visitor_id=visitor.id,
            from_date=visit_date
        ).first()
        
        if not existing_future:
            history2 = VisitorHistoryDetails(
                visitor_id=visitor.id,
                organization_id=nikki_org.id,
                visitor_type="guest",
                host_name=random.choice(nikki_employees).full_name,
                purpose_of_visit=random.choice(purposes),
                allowed_floor=random.choice(floors),
                from_date=visit_date,
                to_date=visit_date,
                is_checked_in=False
            )
            db.session.add(history2)
            print(f"    - Added future/current visit history for {visitor.name}")

    db.session.flush()
    return created_visitors


def seed_all_master_data():
    """Main function to seed all master data for primary organization"""
    
    print("\n" + "="*60)
    print("Starting Master Data Seeding (Primary Organization)")
    print("="*60)
    
    try:
        # Create roles
        roles = create_roles()
        db.session.commit()
        
        # Create super admin user
        super_admin_user = create_super_admin_user(roles)
        db.session.commit()
        
        # Create primary organization
        organizations = create_organizations()
        db.session.commit()
        
        # Create departments
        departments = create_departments(organizations)
        db.session.commit()
        
        # Create shifts
        shifts = create_shifts(organizations)
        db.session.commit()
        
        # Create users and employees
        users, employees = create_users_and_employees(organizations, departments, roles, shifts)
        db.session.commit()
        
        # Create locations
        locations = create_locations(organizations)
        db.session.commit()
        
        # Create cameras
        cameras = create_cameras(organizations, locations)
        db.session.commit()
        
        # Create 2 months of attendance records
        create_attendance_records(employees)
        db.session.commit()
        
        # Create sample leave requests
        leave_requests = create_leave_requests(users, employees)
        db.session.commit()
        
        # Create dummy visitors and their history for nikki
        visitors = create_visitors(organizations, employees)
        db.session.commit()
        
        print("\n" + "="*60)
        print("[SUCCESS] Master Data Seeding Completed Successfully!")
        print("="*60)
        print("\nSummary:")
        print(f"  • Roles: {len(roles)}")
        print(f"  • Organizations: {len(organizations)}")
        print(f"  • Departments: {len(departments)}")
        print(f"  • Shifts: {len(shifts)}")
        print(f"  • Super Admin Users: 1")
        print(f"  • Organization Users: {len(users)}")
        print(f"  • Employees: {len(employees)}")
        print(f"  • Locations: {len(locations)}")
        print(f"  • Cameras: {len(cameras)}")
        print(f"  • Leave Requests: {len(leave_requests)}")
        print(f"  • Visitors: {len(visitors)}")
        print(f"  • Attendance Records: ~{len(employees) * 42} (60 days - weekends, per employee)")
        print("\n" + "-"*60)
        print("SUPER ADMIN CREDENTIALS:")
        print("-"*60)
        print("  Email: superadmin@accesshub.com")
        print("  Username: superadmin")
        print("  Password: SuperAdmin@123")
        print("  Role: Super Administrator (Full System Access)")
        print("\nOrganization: India IT Park (IIT)")
        print("  • Address: 789 IT Boulevard, Hyderabad, India")
        print("  • Timezone: Asia/Kolkata")
        print("  • Subscription Tier: Premium")
        print("\nTest User Credentials (Organization Users):")
        print("  • priya.sharma@indiaittpark.com (Manager)")
        print("  • rajesh.kumar@indiaittpark.com (Team Lead)")
        print("  • neha.gupta@indiaittpark.com (Org Admin)")
        print("  • Password: Test@123 (for all organization users)")
        print("\nLocations Setup:")
        print("  • Main Gate (Entry & Exit)")
        print("  • Tower A Entry/Exit Points")
        print("  • Tower B Entry Point")
        print("  • Back Emergency Exit")
        print("  • Parking Entry")
        print("\nAttendance Data: Last 60 days (2 months)")
        print("  • Includes realistic patterns: 75% present, 15% half-day, 10% absent")
        print("  • Working days only (Monday-Friday)")
        print("\n" + "="*60 + "\n")
        
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"\n[ERROR] Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_all_master_data()
