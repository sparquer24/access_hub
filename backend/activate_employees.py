#!/usr/bin/env python
"""
Activate all inactive employee records
"""
from app import create_app
from app.models.employee import Employee
from app.extensions import db

app = create_app()
ctx = app.app_context()
ctx.push()

# Get all inactive employees
inactive_employees = Employee.query.filter_by(is_active=False).all()
print(f"Found {len(inactive_employees)} inactive employees")

# Activate them
for emp in inactive_employees:
    emp.is_active = True
    print(f"  ✓ Activated: {emp.full_name} (user_id: {emp.user_id})")

# Commit changes
db.session.commit()
print(f"\n✓ Successfully activated {len(inactive_employees)} employees")

# Verify
active_count = Employee.query.filter_by(is_active=True).count()
total_count = Employee.query.count()
print(f"\nTotal Employees: {total_count}")
print(f"Active Employees: {active_count}")
