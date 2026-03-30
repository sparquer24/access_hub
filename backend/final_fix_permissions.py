#!/usr/bin/env python
"""
Fix permissions - brute force approach
"""
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()
ctx = app.app_context()
ctx.push()

print("=== Fixing Camera Permissions ===\n")

# Update each role one by one with raw SQL to ensure it sticks
update_queries = [
    # For manager role
    """UPDATE roles SET permissions = 
    json_set(permissions, '$.cameras', json_array('read', 'create', 'update', 'delete')) 
    WHERE name = 'manager'""",
    
    # For team_lead role
    """UPDATE roles SET permissions = 
    json_set(permissions, '$.cameras', json_array('read')) 
    WHERE name = 'team_lead'""",
    
    # For Employee role  
    """UPDATE roles SET permissions = 
    json_set(permissions, '$.cameras', json_array('read')) 
    WHERE name = 'Employee'""",
    
    # For visitor role
    """UPDATE roles SET permissions = 
    json_set(permissions, '$.cameras', json_array('read')) 
    WHERE name = 'visitor'""",
    
    # For super_admin role
    """UPDATE roles SET permissions = 
    json_set(permissions, '$.cameras', json_array('read', 'create', 'update', 'delete')) 
    WHERE name = 'super_admin'""",
]

for i, query in enumerate(update_queries, 1):
    try:
        db.session.execute(text(query))
        print(f"✓ Updated query {i}")
    except Exception as e:
        print(f"✗ Query {i} failed: {e}")

db.session.commit()
print("\n✓ All updates committed!\n")

# Verify
print("=== Verification ===\n")
result = db.session.execute(text("SELECT name, permissions FROM roles WHERE permissions IS NOT NULL ORDER BY name"))
for row in result:
    role_name, perms_json = row
    if isinstance(perms_json, str):
        import json
        perms = json.loads(perms_json)
    else:
        perms = perms_json
    
    cameras = perms.get('cameras', [])
    has_read = 'read' in cameras if isinstance(cameras, list) else False
    status = "✓" if has_read else "✗"
    print(f"{status} {role_name}: cameras = {cameras}")
