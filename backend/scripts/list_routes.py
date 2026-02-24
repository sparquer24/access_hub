import os, sys
basedir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if basedir not in sys.path:
    sys.path.insert(0, basedir)

from app import create_app

app = create_app()
with app.app_context():
    rules = sorted(list(app.url_map.iter_rules()), key=lambda r: (r.rule, sorted(r.methods)))
    for r in rules:
        print(f"{r.rule} -> {r.endpoint} [{','.join(sorted(r.methods))}]")
