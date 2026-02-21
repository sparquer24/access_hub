import os

files = [
    r"vms_backend\app\api\employees\routes.py",
    r"vms_backend\app\schemas\attendance.py",
    r"vms_backend\app\schemas\audit.py",
    r"vms_backend\app\schemas\organization.py",
    r"vms_backend\app\schemas\employee.py",
    r"vms_backend\app\schemas\__init__.py",
    r"vms_backend\app\schemas\department.py",
    r"vms_backend\app\schemas\shift.py",
    r"vms_backend\app\schemas\camera.py",
    r"vms_backend\app\schemas\location.py",
    r"vms_backend\app\schemas\leave_request.py",
    r"vms_backend\app\schemas\role.py"
]

base_path = r"c:\Users\preml\Desktop\office\vms"

for rel_path in files:
    file_path = os.path.join(base_path, rel_path)
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace max=100 with max=1000 in per_page definition
    new_content = content.replace(
        "per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=100))",
        "per_page = fields.Integer(load_default=20, validate=validate.Range(min=1, max=1000))"
    )
    
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {rel_path}")
    else:
        print(f"No change in {rel_path}")
