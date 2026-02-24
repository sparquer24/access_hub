import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app

app = create_app()
print('BLUEPRINTS:', list(app.blueprints.keys()))
for name, bp in app.blueprints.items():
	print('BP:', name, 'import_name=', getattr(bp, 'import_name', None), 'url_prefix=', getattr(bp, 'url_prefix', None))
print('EXTENSIONS:', list(getattr(app,'extensions',{}).keys()))
