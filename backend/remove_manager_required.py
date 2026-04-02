#!/usr/bin/env python
"""
Remove @manager_required decorators from manager routes
"""
import re

file_path = r'c:\Users\manoj\access_hub\backend\app\api\manager\routes.py'

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Count @manager_required occurrences
count_before = content.count('@manager_required\n')
print(f"Found {count_before} @manager_required decorators")

# Replace @manager_required\n with nothing (remove the line)
content = content.replace('@manager_required\n', '')

# Write back
with open(file_path, 'w') as f:
    f.write(content)

# Verify
with open(file_path, 'r') as f:
    new_content = f.read()

count_after = new_content.count('@manager_required')
print(f"After removal: {count_after} @manager_required decorators remaining")
print(f"✓ Removed {count_before - count_after} @manager_required decorators")
