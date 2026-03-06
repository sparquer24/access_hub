
from app import create_app, db
from app.models.employee import Employee
from app.models.user import User
from app.models.department import Department

app = create_app()

with app.app_context():
    org_id = "e48e7921-3b9d-41de-9ab2-142030c12dd3"
    dept_id = "54814d52-df14-4f54-886c-4659dcdda183"

    print(f"Checking for employees in Org: {org_id}, Dept: {dept_id}")

    # Check Department
    dept = Department.query.get(dept_id)
    print(f"Department found: {dept.name if dept else 'None'}")

    # Check Employees in Dept
    employees = Employee.query.filter_by(
        organization_id=org_id,
        department_id=dept_id
    ).all()

    print(f"Total Employees in Department: {len(employees)}")
    for emp in employees:
        user_status = "Active" if emp.user and emp.user.is_active else "Inactive/NoUser"
        print(f" - {emp.full_name} ({emp.employee_code}) - User: {user_status}")

    # Check all employees in Org (just in case)
    all_employees = Employee.query.filter_by(organization_id=org_id).count()
    print(f"Total Employees in Organization: {all_employees}")
