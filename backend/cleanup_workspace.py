
import os

files_to_remove = [
    'check_db_leaves.py', 'debug_leaves.py', 'debug_leaves_simple.py', 
    'debug_output.txt', 'debug_overlap_specific.py', 'delete_conflicts.py', 
    'leaves_output.txt', 'list_employee_orgs.py', 'list_orgs.py', 'migrate_leaves.py', 
    'resolve_conflict.py', 'run_migrations_manual.py', 'run_seed_master_data.py', 
    'run_server_safe.py', 'test_output.txt', 'test_overlap_message.py', 
    'SERVER_FIX_SUMMARY.md', 'SERVER_RUNNING_SUCCESS.md', 'SERVER_STARTED_SUCCESSFULLY.md', 
    'FIX_AND_RUN.md', 'MIGRATION_FIX_README.md', 'MIGRATION_SUCCESS_SUMMARY.md', 
    'MIGRATION_FIX_GUIDE.md', 'ORGANIZATION_API_FIX.md', 'SEED_FILES_SUMMARY.md'
]

backend_dir = r'c:\Users\preml\Desktop\office\AccessHub\backend'

for file_name in files_to_remove:
    file_path = os.path.join(backend_dir, file_name)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"Removed: {file_name}")
        except Exception as e:
            print(f"Error removing {file_name}: {e}")
    else:
        print(f"Skipped (not found): {file_name}")

# Also remove the script itself
# os.remove(__file__)
