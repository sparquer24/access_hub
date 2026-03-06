# wsgi.py
import os
from app import create_app
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"



app = create_app()

if __name__ == '__main__':
    # Run with SocketIO if available
    import traceback
    try:
        print("Attempting to start server with SocketIO...")
        from app.extensions import socketio
        socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True, use_reloader=False)
    except Exception as e:
        print("Failed to start with SocketIO, falling back to Flask's development server.")
        print(f"Error: {e}")
        traceback.print_exc()
        try:
            print("Attempting to start server with Flask's development server...")
            app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
        except Exception as e2:
            print(f"Failed to start with Flask's development server as well.")
            print(f"Error: {e2}")
            traceback.print_exc()
