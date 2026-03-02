
import random
import uuid
from datetime import datetime, timedelta, date, time
from app import create_app
from app.extensions import db
from app.models.organization import Organization
from app.models.location import Location
from app.models.department import Department
from app.models.employee import Employee
from app.models.user import User
from app.models.role import Role
from app.models.visitor import OrganizationVisitor, VisitorHistoryDetails
from werkzeug.security import generate_password_hash

def seed_nikki_data():
    app = create_app()
    with app.app_context():
        print("Starting seeding for Nikki organization...")

        # 1. Organization
        org_name = "nikki"
        org_code = "NIKKI_HYD"
        org = Organization.query.filter_by(name=org_name).first()
        if not org:
            org = Organization(
                name=org_name,
                code=org_code,
                address="hyd",
                contact_email="admin@nikki.com",
                contact_phone="+91-1234567890",
                organization_type="office",
                enabled_features={
                    "visitor_management": True,
                    "employee_attendance": True
                }
            )
            db.session.add(org)
            db.session.commit()
            print(f"Created Organization: {org.name}")
        else:
            print(f"Organization {org_name} already exists.")

        # 2. Ensure Role
        role = Role.query.filter_by(name="employee").first()
        if not role:
            role = Role(name="employee", description="Employee role")
            db.session.add(role)
            db.session.commit()

        # 3. Create a few employees to act as hosts
        hosts = []
        for i in range(1, 4):
            email = f"host{i}@nikki.com"
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(email=email, username=f"host{i}", role_id=role.id)
                user.password_hash = generate_password_hash("password123")
                db.session.add(user)
                db.session.flush()

                emp = Employee(
                    user_id=user.id,
                    organization_id=org.id,
                    employee_code=f"NIKKI_HOST_{i}",
                    full_name=f"Nikki Host {i}",
                    gender="male" if i % 2 == 0 else "female"
                )
                db.session.add(emp)
                db.session.commit()
                hosts.append(emp)
            else:
                emp = Employee.query.filter_by(user_id=user.id).first()
                if emp: hosts.append(emp)

        # 4. Create dummy visitors and their history
        visitor_data = [
            {"name": "Amit Kumar", "phone": "+91-9000000001", "email": "amit@example.com", "gender": "male"},
            {"name": "Priya Sharma", "phone": "+91-9000000002", "email": "priya@example.com", "gender": "female"},
            {"name": "John Doe", "phone": "+91-9000000003", "email": "john@example.com", "gender": "male"},
            {"name": "Sneha Reddy", "phone": "+91-9000000004", "email": "sneha@example.com", "gender": "female"},
            {"name": "Rahul Verma", "phone": "+91-9000000005", "email": "rahul@example.com", "gender": "male"}
        ]

        purposes = ["Meeting", "Interview", "Delivery", "Personal", "Maintenance"]
        floors = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"]

        today = datetime.utcnow().date()

        for data in visitor_data:
            # Check if visitor already exists
            visitor = OrganizationVisitor.query.filter_by(organization_id=org.id, phone=data["phone"]).first()
            if not visitor:
                visitor = OrganizationVisitor(
                    organization_id=org.id,
                    name=data["name"],
                    phone=data["phone"],
                    email=data["email"],
                    gender=data["gender"]
                )
                db.session.add(visitor)
                db.session.flush()
                print(f"Created Visitor: {visitor.name}")

            # Create some history for each visitor
            # Past visit
            past_date = today - timedelta(days=random.randint(1, 10))
            host = random.choice(hosts)
            history1 = VisitorHistoryDetails(
                visitor_id=visitor.id,
                organization_id=org.id,
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

            # Current or upcoming visit
            visit_date = today if random.random() > 0.5 else today + timedelta(days=1)
            history2 = VisitorHistoryDetails(
                visitor_id=visitor.id,
                organization_id=org.id,
                visitor_type="guest",
                host_name=random.choice(hosts).full_name,
                purpose_of_visit=random.choice(purposes),
                allowed_floor=random.choice(floors),
                from_date=visit_date,
                to_date=visit_date,
                is_checked_in=False
            )
            db.session.add(history2)

        db.session.commit()
        print("Nikki organization and dummy visitor data seeded successfully!")

if __name__ == "__main__":
    seed_nikki_data()
