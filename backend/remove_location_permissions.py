#!/usr/bin/env python
"""
Remove @require_permission decorators from locations routes
"""

file_path = r'c:\Users\manoj\access_hub\backend\app\api\locations\routes.py'

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Count @require_permission occurrences
count_before = content.count('@require_permission(')
print(f"Found {count_before} @require_permission decorators")

# Remove all lines with @require_permission
lines = content.split('\n')
new_lines = [line for line in lines if '@require_permission' not in line]
content = '\n'.join(new_lines)

# Write back
with open(file_path, 'w') as f:
    f.write(content)

# Verify
with open(file_path, 'r') as f:
    new_content = f.read()

count_after = new_content.count('@require_permission(')
print(f"After removal: {count_after} @require_permission decorators remaining")
print(f"✓ Removed {count_before - count_after} @require_permission decorators")
