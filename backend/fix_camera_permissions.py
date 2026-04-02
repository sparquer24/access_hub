#!/usr/bin/env python
"""
Add cameras:read permission to all employee roles
"""
from app import create_app
from app.models.role import Role
from app.extensions import db

app = create_app()
ctx = app.app_context()
ctx.push()

print("=== Adding cameras:read to all roles ===\n")

# Add cameras:read permission to ALL roles
all_roles = Role.query.all()

for role in all_roles:
    if not role.permissions:
        role.permissions = {}
    
    # Add cameras permission with read action
    if 'cameras' not in role.permissions:
        role.permissions['cameras'] = []
    
    if 'read' not in role.permissions['cameras']:
        role.permissions['cameras'].append('read')
        print(f"✓ Added cameras:read to {role.name} role")
    else:
        print(f"  {role.name} role already has cameras:read")

db.session.commit()
print("\n✓ All roles updated successfully!")

print("\n=== Verification: Updated Roles ===\n")
roles = Role.query.all()
for role in roles:
    cameras_perm = role.permissions.get('cameras', []) if role.permissions else []
    has_read = 'read' in cameras_perm
    status = "✓" if has_read else "✗"
    print(f"{status} {role.name}: cameras:read = {has_read}")
