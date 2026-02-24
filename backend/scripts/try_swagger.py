import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
from flasgger import Swagger
import traceback

app = create_app()
print('APP_CREATED')
try:
    Swagger(app)
    print('SWAGGER_INIT_SUCCESS')
except Exception as e:
    print('SWAGGER_INIT_FAILED')
    traceback.print_exc()
