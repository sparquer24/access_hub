# wsgi.py
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Run with SocketIO if available
    try:
        from app.extensions import socketio
        socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)
    except:
        app.run(host='0.0.0.0', port=5001, debug=True)
