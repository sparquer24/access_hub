#!/usr/bin/env python
"""
Update camera permissions using Python ORM
"""
from app import create_app
from app.models.role import Role
from app.extensions import db
import json

app = create_app()
ctx = app.app_context()
ctx.push()

print("=== Updating Camera Permissions ===\n")

# Get all roles
roles_to_fix = ['super_admin', 'org_admin', 'manager', 'team_lead', 'visitor', 'Employee', 'admin']

for role_name in roles_to_fix:
    role = db.session.query(Role).filter_by(name=role_name).first()
    
    if not role:
        print(f"✗ Role {role_name} not found")
        continue
    
    # Get current permissions
    perms = role.permissions if role.permissions else {}
    print(f"Before - {role_name}: {perms.get('cameras', 'NOT SET')}")
    
    # Add cameras:read
    if 'cameras' not in perms:
        perms['cameras'] = []
    
    if not isinstance(perms['cameras'], list):
        perms['cameras'] = ['read']
    elif 'read' not in perms['cameras']:
        perms['cameras'].append('read')
    
   # Mark as modified
    role.permissions = perms
    
    print(f"After - {role_name}: {perms.get('cameras')}")
    print()

# Commit
db.session.commit()
print("✓ Committed all changes\n")

# Verify by querying fresh
print("=== Final Verification ===\n")
for role_name in roles_to_fix:
    role = db.session.query(Role).filter_by(name=role_name).first()
    if role and role.permissions:
        cameras = role.permissions.get('cameras', [])
        has_read = 'read' in cameras
        status = "✓" if has_read else "✗"
        print(f"{status} {role_name}: cameras = {cameras}")
    else:
        print(f"✗ {role_name}: No permissions or role not found")
