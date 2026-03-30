#!/usr/bin/env python
"""
Directly query and update database roles
"""
from app import create_app
from app.models.role import Role
from app.extensions import db
from sqlalchemy import text

app = create_app()
ctx = app.app_context()
ctx.push()

print("=== Direct DB Query ===\n")
# Query roles table directly
result = db.session.execute(text("SELECT name, permissions FROM roles"))
for row in result:
    role_name, perms_json = row
    print(f"Role: {role_name}")
    print(f"  Permissions JSON: {perms_json}")
    print()

print("\n=== Updating all roles with cameras:read ===\n")

# Update all roles to have cameras:read
roles = Role.query.all()
for role in roles:
    # Ensure permissions dict exists
    if role.permissions is None:
        role.permissions = {}
    
    # Ensure 'cameras' key exists
    if 'cameras' not in role.permissions:
        role.permissions['cameras'] = []
    
    # Add 'read' if not present
    if isinstance(role.permissions['cameras'], list):
        if 'read' not in role.permissions['cameras']:
            role.permissions['cameras'].append('read')
    
    print(f"Updated {role.name}: {role.permissions.get('cameras', [])}")

# Commit all changes
db.session.commit()

print("\n=== Verification after commit ===\n")
# Re-query directly
result = db.session.execute(text("SELECT name, permissions FROM roles"))
for row in result:
    role_name, perms_json = row
    print(f"{role_name}: {perms_json}")
