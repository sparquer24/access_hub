import json
import select
import time

from sqlalchemy import text

from ..extensions import db, socketio

ALERTS_CHANNEL = "alerts_realtime"
MOVEMENT_CHANNEL = "visitor_movement_realtime"

_listener_started = False


def install_db_notify_triggers():
    """
    Ensure PostgreSQL triggers exist to broadcast DB row changes via NOTIFY.
    Safe to call repeatedly.
    """
    statements = [
        f"""
        CREATE OR REPLACE FUNCTION notify_alerts_realtime()
        RETURNS trigger
        AS $$
        DECLARE
            v_name TEXT;
            v_phone TEXT;
        BEGIN
            SELECT name, phone
            INTO v_name, v_phone
            FROM visitors
            WHERE id = NEW.visitor_id
            LIMIT 1;

            PERFORM pg_notify(
                '{ALERTS_CHANNEL}',
                json_build_object(
                    'event', 'new_alert',
                    'id', NEW.id,
                    'organization_id', NEW.organization_id,
                    'visitor_id', NEW.visitor_id,
                    'visitor_name', v_name,
                    'visitor_phone', v_phone,
                    'camera_id', NEW.camera_id,
                    'alert_type', NEW.alert_type,
                    'alert_time', NEW.alert_time,
                    'has_annotated_image', (NEW.annotated_image_base64 IS NOT NULL),
                    'alert_status', COALESCE(NEW.alert_status, 'yet_to_handle')
                )::text
            );

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,
        """
        DROP TRIGGER IF EXISTS trg_notify_alerts_realtime ON alerts;
        """,
        """
        CREATE TRIGGER trg_notify_alerts_realtime
        AFTER INSERT ON alerts
        FOR EACH ROW
        EXECUTE FUNCTION notify_alerts_realtime();
        """,
        f"""
        CREATE OR REPLACE FUNCTION notify_visitor_movement_realtime()
        RETURNS trigger
        AS $$
        DECLARE
            v_org_id TEXT;
            v_name TEXT;
            v_phone TEXT;
        BEGIN
            SELECT organization_id, name, phone
            INTO v_org_id, v_name, v_phone
            FROM visitors
            WHERE id = NEW.visitor_id
            LIMIT 1;

            PERFORM pg_notify(
                '{MOVEMENT_CHANNEL}',
                json_build_object(
                    'event', 'visitor_movement_logged',
                    'operation', TG_OP,
                    'id', NEW.id,
                    'organization_id', v_org_id,
                    'visitor_id', NEW.visitor_id,
                    'visitor_name', v_name,
                    'visitor_phone', v_phone,
                    'tower', NEW.tower,
                    'floor', NEW.floor,
                    'status', NEW.status,
                    'entry_time', NEW.entry_time,
                    'exit_time', NEW.exit_time,
                    'created_at', NEW.created_at
                )::text
            );

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,
        """
        DROP TRIGGER IF EXISTS trg_notify_visitor_movement_realtime ON visitor_movement_logs;
        """,
        """
        CREATE TRIGGER trg_notify_visitor_movement_realtime
        AFTER INSERT OR UPDATE ON visitor_movement_logs
        FOR EACH ROW
        EXECUTE FUNCTION notify_visitor_movement_realtime();
        """,
    ]

    try:
        for stmt in statements:
            db.session.execute(text(stmt))
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def _emit_from_notification(channel, payload):
    organization_id = payload.get("organization_id")
    if not organization_id:
        return

    if channel == ALERTS_CHANNEL:
        socketio.emit("new_alert", payload, room=f"alerts_{organization_id}")
        return

    if channel == MOVEMENT_CHANNEL:
        socketio.emit("visitor_movement_logged", payload, room=f"org_{organization_id}")


def _listen_forever(app):
    """
    Keep a dedicated LISTEN/NOTIFY connection and fan out websocket events.
    Reconnects automatically on failure.
    """
    while True:
        raw_conn = None
        cursor = None
        try:
            with app.app_context():
                raw_conn = db.engine.raw_connection()

            raw_conn.autocommit = True
            cursor = raw_conn.cursor()
            cursor.execute(f"LISTEN {ALERTS_CHANNEL};")
            cursor.execute(f"LISTEN {MOVEMENT_CHANNEL};")
            app.logger.info(
                "Realtime DB listener started (channels: %s, %s)",
                ALERTS_CHANNEL,
                MOVEMENT_CHANNEL,
            )

            while True:
                ready, _, _ = select.select([raw_conn], [], [], 5)
                if not ready:
                    continue

                raw_conn.poll()
                while raw_conn.notifies:
                    notify = raw_conn.notifies.pop(0)
                    payload = json.loads(notify.payload)
                    _emit_from_notification(notify.channel, payload)
        except Exception:
            try:
                app.logger.exception("Realtime DB listener failed, retrying in 2 seconds")
            except Exception:
                pass
            time.sleep(2)
        finally:
            if cursor is not None:
                try:
                    cursor.close()
                except Exception:
                    pass
            if raw_conn is not None:
                try:
                    raw_conn.close()
                except Exception:
                    pass


def setup_db_realtime_bridge(app):
    """
    Install DB triggers and start the websocket bridge listener once per process.
    """
    global _listener_started

    with app.app_context():
        install_db_notify_triggers()

    if _listener_started:
        return

    _listener_started = True
    socketio.start_background_task(_listen_forever, app)
