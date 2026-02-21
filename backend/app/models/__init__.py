"""
Database models for multi-tenant attendance tracking system.
"""

from .organization import Organization
from .role import Role
from .user import User
from .department import Department
from .employee import Employee
from .shift import Shift
from .location import Location
from .camera import Camera
from .face_embedding import FaceEmbedding
from .presence_event import PresenceEvent
from .attendance import AttendanceRecord
from .leave_request import LeaveRequest
from .attendance_change_request import AttendanceChangeRequest
from .audit_log import AuditLog
from .image import Image
from .visitor import (
    OrganizationVisitor, VisitorMovementLog, VisitorAlert,
    VisitorBlacklist, VisitorPreRegistration, VisitorBadge, GroupVisit,
    VisitorDocument, VisitorHealthScreening, VisitorAsset, ContractorTimeLog,
    DeliveryLog, VIPVisitorPreference
)
from .lpr import LPRLog, LPRHotlist, LPRWhitelist

__all__ = [
    "Organization",
    "Role",
    "User",
    "Department",
    "Employee",
    "Shift",
    "Location",
    "Camera",
    "FaceEmbedding",
    "PresenceEvent",
    "AttendanceRecord",
    "LeaveRequest",
    "AttendanceChangeRequest",
    "AuditLog",
    "Image",
    "OrganizationVisitor",
    "VisitorMovementLog",
    "VisitorAlert",
    "VisitorBlacklist",
    "VisitorPreRegistration",
    "VisitorBadge",
    "GroupVisit",
    "VisitorDocument",
    "VisitorHealthScreening",
    "VisitorAsset",
    "ContractorTimeLog",
    "DeliveryLog",
    "VIPVisitorPreference",
    "LPRLog",
    "LPRHotlist",
    "LPRWhitelist",
]

# Backwards-compat: some older code and migrations expect legacy models
# defined in `app/models.py` (module, not package). If that file exists,
# import it as `app.legacy_models` and expose `UserDetails`, `VisitorDetails`,
# and `VisitorImage` at package level so `from ..models import UserDetails` works.
try:
    import importlib.util
    import os

    pkg_dir = os.path.dirname(__file__)  # app/models/
    legacy_path = os.path.normpath(os.path.join(pkg_dir, "..", "models.py"))  # app/models.py
    if os.path.exists(legacy_path):
        spec = importlib.util.spec_from_file_location("app.legacy_models", legacy_path)
        legacy = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(legacy)

        # Expose legacy classes if they exist
        UserDetails = getattr(legacy, "UserDetails", None)
        VisitorDetails = getattr(legacy, "VisitorDetails", None)
        VisitorImage = getattr(legacy, "VisitorImage", None)

        # Add to __all__ so wildcard imports include them
        if UserDetails or VisitorDetails or VisitorImage:
            __all__.extend([n for n in ("UserDetails", "VisitorDetails", "VisitorImage") if locals().get(n)])
except Exception:
    # best-effort; if anything goes wrong, don't break package import
    pass