import sys, os, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
app = create_app()
client = app.test_client()
resp = client.get('/apispec.json')
js = resp.get_json()
paths = js.get('paths', {})
for p in sorted(paths):
    if 'visitor' in p.lower():
        print(p)
        for m, op in paths[p].items():
            print(' ', m, '->', op.get('tags'))
