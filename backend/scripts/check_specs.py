import sys, os, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app

app = create_app()
client = app.test_client()

for path in ['/apispec.json', '/api/docs/openapi.json', '/api/docs/endpoints']:
    try:
        resp = client.get(path)
        print(path, resp.status_code)
        if resp.status_code == 200:
            data = resp.get_data(as_text=True)
            try:
                j = json.loads(data)
                # check if any path contains 'visitor'
                paths = j.get('paths') or j.get('paths', {})
                contains = any('visitor' in p.lower() for p in (paths.keys() if isinstance(paths, dict) else []))
                print('  contains visitor in paths:', contains)
            except Exception as e:
                print('  failed to parse json', e)
    except Exception as ex:
        print('  error fetching', ex)
