import argparse
import os
import random
import sys
import uuid
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import create_app
from app.extensions import db
from app.events.alerts import emit_new_alert
from app.models.alerts import Alert
from app.models.camera import Camera
from app.models.location import Location
from app.models.organization import Organization
from app.models.visitor import OrganizationVisitor


def _resolve_ids(organization_id=None, visitor_id=None, camera_id=None):
    org = None
    visitor = None
    camera = None

    if organization_id:
        org = Organization.query.get(organization_id)
        if not org:
            raise ValueError(f"Organization not found: {organization_id}")
    else:
        org = Organization.query.first()
        if not org:
            raise ValueError("No organizations found. Seed organization data first.")

    if visitor_id:
        visitor = OrganizationVisitor.query.get(visitor_id)
        if not visitor:
            raise ValueError(f"Visitor not found: {visitor_id}")
    else:
        visitor = OrganizationVisitor.query.filter_by(organization_id=org.id).first()
        if not visitor:
            raise ValueError(
                "No visitors found for selected organization. Create/check-in a visitor first."
            )

    if camera_id:
        camera = Camera.query.get(camera_id)
        if not camera:
            raise ValueError(f"Camera not found: {camera_id}")
    else:
        camera = Camera.query.filter_by(organization_id=org.id).first()
        if not camera:
            raise ValueError(
                "No cameras found for selected organization. Seed camera data first."
            )

    return org.id, visitor.id, camera.id


def _create_test_visitor(org, index=1):
    suffix = uuid.uuid4().hex[:6]
    visitor = OrganizationVisitor(
        organization_id=org.id,
        name=f"Test Visitor {index} - {org.code}",
        email=f"test.visitor.{org.code.lower()}.{suffix}@example.com",
        phone=f"9{random.randint(100000000, 999999999)}",
        gender="Other",
    )
    db.session.add(visitor)
    db.session.flush()
    return visitor


def _get_or_create_camera(org):
    camera = Camera.query.filter_by(organization_id=org.id).first()
    if camera:
        return camera

    location = Location.query.filter_by(organization_id=org.id).first()
    if not location:
        location = Location(
            organization_id=org.id,
            name="Auto Test Location",
            location_type="BOTH",
            is_active=True,
        )
        db.session.add(location)
        db.session.flush()

    camera = Camera(
        organization_id=org.id,
        location_id=location.id,
        name=f"Auto Test Cam {org.code}",
        camera_type="CHECK_IN",
        source_type="RTSP_STREAM",
        status="online",
        is_active=True,
    )
    db.session.add(camera)
    db.session.flush()
    return camera


def _insert_alert_row(org_id, visitor_id, camera_id, alert_type, alert_status, annotated_image_base64=None):
    alert = Alert(
        id=str(uuid.uuid4()),
        organization_id=org_id,
        visitor_id=visitor_id,
        camera_id=camera_id,
        alert_type=alert_type,
        alert_time=datetime.utcnow(),
        annotated_image_base64=annotated_image_base64,
        alert_status=alert_status,
    )
    db.session.add(alert)
    return alert


def insert_alert(args):
    organization_id, visitor_id, camera_id = _resolve_ids(
        organization_id=args.organization_id,
        visitor_id=args.visitor_id,
        camera_id=args.camera_id,
    )

    alert = _insert_alert_row(
        org_id=organization_id,
        visitor_id=visitor_id,
        camera_id=camera_id,
        alert_type=args.alert_type,
        alert_status=args.alert_status,
        annotated_image_base64=args.annotated_image_base64,
    )
    db.session.commit()

    if args.emit_websocket:
        emit_new_alert(alert)

    print("✅ Alert inserted successfully")
    print(f"   id: {alert.id}")
    print(f"   organization_id: {alert.organization_id}")
    print(f"   visitor_id: {alert.visitor_id}")
    print(f"   camera_id: {alert.camera_id}")
    print(f"   alert_type: {alert.alert_type}")
    print(f"   alert_status: {alert.alert_status}")
    print(f"   alert_time: {alert.alert_time.isoformat()}")


def insert_alerts_for_all_organizations(args):
    organizations = Organization.query.order_by(Organization.created_at.asc()).all()
    if not organizations:
        raise ValueError("No organizations found. Seed organization data first.")

    if args.per_org_min < 1:
        raise ValueError("--per-org-min must be >= 1")
    if args.per_org_max < args.per_org_min:
        raise ValueError("--per-org-max must be >= --per-org-min")

    total_alerts = 0
    total_visitors_created = 0
    total_cameras_created = 0
    inserted_alerts = []

    alert_types = ["unauthorized", "blacklist_hit", "overstay", "floor_violation"]

    for org in organizations:
        count = random.randint(args.per_org_min, args.per_org_max)

        visitors = OrganizationVisitor.query.filter_by(organization_id=org.id).all()
        if len(visitors) < count:
            needed = count - len(visitors)
            for i in range(needed):
                visitors.append(_create_test_visitor(org, index=i + 1))
                total_visitors_created += 1

        existing_camera = Camera.query.filter_by(organization_id=org.id).first()
        camera = _get_or_create_camera(org)
        if not existing_camera:
            total_cameras_created += 1

        for idx in range(count):
            visitor = visitors[idx % len(visitors)]
            alert_type = args.alert_type if args.alert_type != "random" else alert_types[idx % len(alert_types)]
            inserted_alerts.append(_insert_alert_row(
                org_id=org.id,
                visitor_id=visitor.id,
                camera_id=camera.id,
                alert_type=alert_type,
                alert_status=args.alert_status,
                annotated_image_base64=args.annotated_image_base64,
            ))
            total_alerts += 1

    db.session.commit()

    if args.emit_websocket:
        for alert in inserted_alerts:
            emit_new_alert(alert)

    print("✅ Bulk alert insertion completed")
    print(f"   organizations processed: {len(organizations)}")
    print(f"   alerts inserted: {total_alerts}")
    print(f"   visitors auto-created: {total_visitors_created}")
    print(f"   cameras auto-created: {total_cameras_created}")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Insert a test row into alerts table for local testing"
    )
    parser.add_argument(
        "--all-organizations",
        action="store_true",
        help="Insert alerts for every organization in the organizations table.",
    )
    parser.add_argument(
        "--emit-websocket",
        action="store_true",
        help="Emit inserted alerts over WebSocket (new_alert event).",
    )
    parser.add_argument(
        "--per-org-min",
        type=int,
        default=2,
        help="Minimum alerts per organization when --all-organizations is used.",
    )
    parser.add_argument(
        "--per-org-max",
        type=int,
        default=3,
        help="Maximum alerts per organization when --all-organizations is used.",
    )
    parser.add_argument(
        "--organization-id",
        help="Existing organization ID. If omitted, first organization is used.",
    )
    parser.add_argument(
        "--visitor-id",
        help="Existing visitor ID. If omitted, first visitor in org is used.",
    )
    parser.add_argument(
        "--camera-id",
        help="Existing camera ID. If omitted, first camera in org is used.",
    )
    parser.add_argument(
        "--alert-type",
        default="unauthorized",
        choices=["unauthorized", "blacklist_hit", "overstay", "floor_violation", "unknown", "random"],
        help="Alert type value.",
    )
    parser.add_argument(
        "--alert-status",
        default="yet_to_handle",
        choices=["yet_to_handle", "handled"],
        help="Alert status value.",
    )
    parser.add_argument(
        "--annotated-image-base64",
        default=None,
        help="Optional base64 image payload for annotated snapshot.",
    )
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        try:
            if args.all_organizations:
                insert_alerts_for_all_organizations(args)
            else:
                insert_alert(args)
        except Exception as exc:
            db.session.rollback()
            print(f"❌ Failed to insert alert: {exc}")
            raise SystemExit(1)


if __name__ == "__main__":
    main()
