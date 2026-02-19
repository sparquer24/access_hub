"""
Comprehensive Master/Test Data Seeding Script for Single Organization
Creates roles with permissions, one primary organization, departments, employees, shifts, test users,
and 2 months of detailed attendance logs for testing and analytics.
"""

from datetime import datetime, date, time, timedelta
from ..extensions import db, bcrypt
from ..models import (
    Role, Organization, Department, Employee, User, Shift, AttendanceRecord,
    Location, Camera, LeaveRequest
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
    """Create primary test organization"""
    
    print("\n--- Creating Primary Organization ---")
    
    # Focus on one comprehensive organization
    org_data = {
        "name": "India IT Park",
        "code": "IIT",
        "organization_type": "office",
        "address": "789 IT Boulevard, Hyderabad, India",
        "contact_email": "contact@indiaittpark.com",
        "contact_phone": "+91-40-2331-0000",
        "timezone": "Asia/Kolkata",
        "subscription_tier": "premium",
    }
    
    created_org = None
    existing_org = Organization.query.filter_by(code=org_data["code"]).first()
    
    if existing_org:
        print(f"  [INFO] Organization already exists: {org_data['name']}")
        created_org = existing_org
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
        created_org = org
    
    return [created_org]


def create_departments(organizations):
    """Create departments for primary organization"""
    
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
    
    # Create departments only for the primary organization
    org = organizations[0]
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
    """Create work shifts for primary organization"""
    
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
    
    # Create shifts only for the primary organization
    org = organizations[0]
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
    """Create test users and linked employees for primary organization"""
    
    print("\n--- Creating Users and Employees ---")
    
    org = organizations[0]  # Primary organization
    
    # Comprehensive employees data for primary organization
    employees_data = [
        # Engineering Department
        {
            "dept_code": "ENG",
            "full_name": "Priya Sharma",
            "email": "priya.sharma@indiaittpark.com",
            "username": "priya_sharma",
            "employee_code": "IIT001",
            "designation": "Senior Developer",
            "gender": "female",
            "role": "manager",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "ENG",
            "full_name": "Rajesh Kumar",
            "email": "rajesh.kumar@indiaittpark.com",
            "username": "rajesh_kumar",
            "employee_code": "IIT002",
            "designation": "Developer",
            "gender": "male",
            "role": "team_lead",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "ENG",
            "full_name": "Neelam Verma",
            "email": "neelam.verma@indiaittpark.com",
            "username": "neelam_verma",
            "employee_code": "IIT003",
            "designation": "Junior Developer",
            "gender": "female",
            "role": "employee",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "ENG",
            "full_name": "Arun Singh",
            "email": "arun.singh@indiaittpark.com",
            "username": "arun_singh",
            "employee_code": "IIT004",
            "designation": "QA Engineer",
            "gender": "male",
            "role": "employee",
            "shift_name": "Morning Shift",
        },
        
        # Finance Department
        {
            "dept_code": "FIN",
            "full_name": "Neha Gupta",
            "email": "neha.gupta@indiaittpark.com",
            "username": "neha_gupta",
            "employee_code": "IIT005",
            "designation": "Finance Manager",
            "gender": "female",
            "role": "org_admin",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "FIN",
            "full_name": "Vikram Desai",
            "email": "vikram.desai@indiaittpark.com",
            "username": "vikram_desai",
            "employee_code": "IIT006",
            "designation": "Accountant",
            "gender": "male",
            "role": "employee",
            "shift_name": "Morning Shift",
        },
        
        # Sales Department
        {
            "dept_code": "SAL",
            "full_name": "Anjali Patel",
            "email": "anjali.patel@indiaittpark.com",
            "username": "anjali_patel",
            "employee_code": "IIT007",
            "designation": "Sales Manager",
            "gender": "female",
            "role": "manager",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "SAL",
            "full_name": "Rohan Malhotra",
            "email": "rohan.malhotra@indiaittpark.com",
            "username": "rohan_malhotra",
            "employee_code": "IIT008",
            "designation": "Sales Executive",
            "gender": "male",
            "role": "employee",
            "shift_name": "Morning Shift",
        },
        
        # HR Department
        {
            "dept_code": "HR",
            "full_name": "Divya Nair",
            "email": "divya.nair@indiaittpark.com",
            "username": "divya_nair",
            "employee_code": "IIT009",
            "designation": "HR Manager",
            "gender": "female",
            "role": "manager",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "HR",
            "full_name": "Suresh Iyer",
            "email": "suresh.iyer@indiaittpark.com",
            "username": "suresh_iyer",
            "employee_code": "IIT010",
            "designation": "HR Executive",
            "gender": "male",
            "role": "employee",
            "shift_name": "Morning Shift",
        },
        
        # Operations Department
        {
            "dept_code": "OPE",
            "full_name": "Kavya Reddy",
            "email": "kavya.reddy@indiaittpark.com",
            "username": "kavya_reddy",
            "employee_code": "IIT011",
            "designation": "Operations Manager",
            "gender": "female",
            "role": "manager",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "OPE",
            "full_name": "Arjun Patel",
            "email": "arjun.patel@indiaittpark.com",
            "username": "arjun_patel",
            "employee_code": "IIT012",
            "designation": "Operations Executive",
            "gender": "male",
            "role": "employee",
            "shift_name": "Evening Shift",
        },
        
        # Support Department
        {
            "dept_code": "SUP",
            "full_name": "Shreya Chopra",
            "email": "shreya.chopra@indiaittpark.com",
            "username": "shreya_chopra",
            "employee_code": "IIT013",
            "designation": "Support Lead",
            "gender": "female",
            "role": "team_lead",
            "shift_name": "Morning Shift",
        },
        {
            "dept_code": "SUP",
            "full_name": "Deepak Nayak",
            "email": "deepak.nayak@indiaittpark.com",
            "username": "deepak_nayak",
            "employee_code": "IIT014",
            "designation": "Support Executive",
            "gender": "male",
            "role": "employee",
            "shift_name": "Evening Shift",
        },
    ]
    
    created_users = []
    created_employees = []
    
    for emp_data in employees_data:
        # Find department
        dept = next((d for d in departments if d.organization_id == org.id and d.code == emp_data["dept_code"]), None)
        if not dept:
            print(f"  [WARNING] Department {emp_data['dept_code']} not found, skipping employee {emp_data['full_name']}")
            continue
        
        # Find shift
        shift = next((s for s in shifts if s.organization_id == org.id and s.name == emp_data["shift_name"]), None)
        
        # Find role
        role = roles.get(emp_data["role"])
        if not role:
            print(f"  [WARNING] Role {emp_data['role']} not found, skipping employee {emp_data['full_name']}")
            continue
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=emp_data["email"]).first()
        
        if existing_user:
            print(f"  [INFO] User already exists: {emp_data['full_name']} ({emp_data['email']})")
            created_users.append(existing_user)
        else:
            # Create user
            user = User(
                email=emp_data["email"],
                username=emp_data["username"],
                password_hash=bcrypt.generate_password_hash("Test@123").decode('utf-8'),
                role_id=role.id,
                organization_id=org.id,
                is_active=True
            )
            db.session.add(user)
            db.session.flush()
            print(f"  [SUCCESS] Created user: {emp_data['full_name']} (Role: {role.name})")
            created_users.append(user)
            
            # Create employee linked to user
            employee = Employee(
                user_id=user.id,
                organization_id=org.id,
                department_id=dept.id,
                employee_code=emp_data["employee_code"],
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
            print(f"    [SUCCESS] Created employee: {emp_data['full_name']}")
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
    
    for employee in employees:
        print(f"\n  Creating attendance for: {employee.full_name}")
        employee_records = 0
        
        # Create records for last 60 days (2 months)
        for days_ago in range(60, 0, -1):
            record_date = today - timedelta(days=days_ago)
            
            # Skip weekends (Saturday=5, Sunday=6)
            if record_date.weekday() >= 5:
                continue
            
            # Varied attendance pattern for realistic data
            import random
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
                check_in = datetime.combine(record_date, datetime.strptime(f"09:{variance:02d}", "%H:%M").time())
                check_out = datetime.combine(record_date, datetime.strptime("17:45", "%H:%M").time())
                work_hours = 8.5
            elif status_choice == "half_day":
                check_in = datetime.combine(record_date, datetime.strptime("09:15", "%H:%M").time())
                check_out = datetime.combine(record_date, datetime.strptime("13:00", "%H:%M").time())
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
        {
            "name": "Tower A Exit",
            "location_type": "EXIT",
            "description": "Tower A exit point",
            "building": "Tower A",
            "floor": "Ground Floor",
            "area": "North Side",
            "latitude": 17.3852,
            "longitude": 78.4869,
        },
        {
            "name": "Tower B Entry",
            "location_type": "ENTRY",
            "description": "Tower B entrance",
            "building": "Tower B",
            "floor": "Ground Floor",
            "area": "East Side",
            "latitude": 17.3853,
            "longitude": 78.4870,
        },
        {
            "name": "Back Exit",
            "location_type": "EXIT",
            "description": "Emergency/back exit",
            "building": "Main Building",
            "floor": "Ground Floor",
            "area": "South Side",
            "latitude": 17.3849,
            "longitude": 78.4866,
        },
        {
            "name": "Parking Entry",
            "location_type": "ENTRY",
            "description": "Vehicle parking entrance",
            "building": "Parking",
            "floor": "Level 1",
            "area": "Basement",
            "latitude": 17.3848,
            "longitude": 78.4865,
        },
    ]
    
    created_locations = []
    org = organizations[0]
    
    for loc_data in locations_data:
        existing_loc = Location.query.filter_by(
            organization_id=org.id,
            name=loc_data["name"]
        ).first()
        
        if existing_loc:
            print(f"  [INFO] Location already exists: {loc_data['name']}")
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
            print(f"  [SUCCESS] Created location: {loc_data['name']}")
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
        },
        {
            "location_name": "Tower A Entry",
            "cameras": [
                {
                    "name": "Tower A Entry Cam",
                    "camera_type": "CHECK_IN",
                    "source_type": "IP_CAMERA",
                    "source_url": "192.168.1.102",
                },
            ]
        },
        {
            "location_name": "Tower B Entry",
            "cameras": [
                {
                    "name": "Tower B Entry Cam",
                    "camera_type": "CHECK_IN",
                    "source_type": "IP_CAMERA",
                    "source_url": "192.168.1.103",
                },
            ]
        },
    ]
    
    created_cameras = []
    org = organizations[0]
    
    for config in cameras_config:
        # Find location
        location = next((l for l in locations if l.name == config["location_name"]), None)
        if not location:
            print(f"  [WARNING] Location not found: {config['location_name']}")
            continue
        
        for cam_data in config["cameras"]:
            existing_cam = Camera.query.filter_by(
                organization_id=org.id,
                location_id=location.id,
                name=cam_data["name"]
            ).first()
            
            if existing_cam:
                print(f"  [INFO] Camera already exists: {cam_data['name']}")
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
                print(f"  [SUCCESS] Created camera: {cam_data['name']} at {config['location_name']}")
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
    from flask import Flask
    from ..config import Config
    
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        seed_all_master_data()
