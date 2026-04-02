#!/usr/bin/env python
"""
Check and fix roles and permissions
"""
from app import create_app
from app.models.role import Role
from app.extensions import db

app = create_app()
ctx = app.app_context()
ctx.push()

print("=== Roles and their permissions ===\n")
roles = Role.query.all()
for role in roles:
    print(f"Role: {role.name}")
    print(f"  Permissions: {role.permissions if role.permissions else 'None'}")
    print()

print("\n=== Adding cameras:read permission to all roles ===\n")

# Add cameras:read permission to employee, manager, org_admin, and super_admin roles
roles_to_update = ['employee', 'manager', 'org_admin', 'super_admin']

for role_name in roles_to_update:
    role = Role.query.filter_by(name=role_name).first()
    if role:
        if not role.permissions:
            role.permissions = {}
        
        # Add cameras permission with read action
        if 'cameras' not in role.permissions:
            role.permissions['cameras'] = []
        
        if 'read' not in role.permissions['cameras']:
            role.permissions['cameras'].append('read')
            print(f"✓ Added cameras:read to {role_name} role")
        else:
            print(f"  {role_name} role already has cameras:read")

db.session.commit()
print("\n✓ All roles updated successfully!")

print("\n=== Updated Roles and their permissions ===\n")
roles = Role.query.all()
for role in roles:
    print(f"Role: {role.name}")
    print(f"  Permissions: {role.permissions if role.permissions else 'None'}")
    print()
