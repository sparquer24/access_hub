from ..extensions import db
from ..models.lpr import LPRLog, LPRHotlist, LPRWhitelist
from ..schemas.lpr import LPRLogSchema, LPRHotlistSchema, LPRWhitelistSchema
from datetime import datetime, timedelta
import uuid

class LPRService:
    @staticmethod
    def get_logs(organization_id, page=1, per_page=20, vehicle_number=None, date=None):
        from sqlalchemy import func
        query = LPRLog.query.filter_by(organization_id=organization_id)
        
        if vehicle_number:
            query = query.filter(LPRLog.vehicle_number.ilike(f"%{vehicle_number}%"))
            
        if date:
            # Assumes date is passed as 'YYYY-MM-DD' string
            query = query.filter(func.date(LPRLog.timestamp) == date)
            
        return query.order_by(LPRLog.timestamp.desc()).paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def create_manual_entry(organization_id, data):
        """
        Create a manual LPR entry with inspection details.
        """
        # Generate Gate Pass ID but ensure it fits in DB column
        # Format: GP-YYYYMMDD-XXXX
        date_str = datetime.now().strftime("%Y%m%d")
        
        # Simple unique suffix using last 4 of uuid or similar
        # Ideally this should be sequential but for now UUID is fine
        suffix = str(uuid.uuid4().hex)[:4].upper()
        gate_pass_id = f"GP-{date_str}-{suffix}"

        # Handle Images (vehicle_photos list of {type, base64})
        # For simplicity, we are just storing the list of objects for now.
        # In a real app, we would upload these to S3/Storage and save URLs.
        # Assuming data['vehicle_photos'] contains base64 strings which is heavy for DB but okay for prototype.
        # Ideally: ImageService.create_image() for each and store IDs.
        
        processed_photos = []
        if 'vehicle_photos' in data and isinstance(data['vehicle_photos'], list):
            # Just keeping the structure. In production, offload base64.
            processed_photos = data['vehicle_photos']

        # Check Hotlist
        hotlist_match = LPRHotlist.query.filter_by(
            organization_id=organization_id, 
            vehicle_number=data.get('vehicle_number').upper(),
            is_active=True
        ).first()

        status = 'allowed'
        alert_flag = False
        if hotlist_match:
            status = 'flagged'
            alert_flag = True

        log_entry = LPRLog(
            organization_id=organization_id,
            vehicle_number=data.get('vehicle_number').upper(),
            driver_name=data.get('driver_name'),
            driver_phone=data.get('driver_phone'),
            driver_license_id=data.get('driver_license_id'),
            direction='entry', # Manual entries are typically check-ins
            status=status, 
            category='visitor', # Default to visitor for manual
            gate_name=data.get('gate_name', 'Main Gate'),
            checklist_status=data.get('checklist_status', {}),
            vehicle_photos=processed_photos,
            material_declaration=data.get('material_declaration'),
            vehicle_security_check_notes=data.get('vehicle_security_check_notes'), # Ensure model has this or store in checklist
            gate_pass_id=gate_pass_id,
            processing_time_ms=0, # Manual
            confidence_score=1.0 # Manual verification
        )
        
        db.session.add(log_entry)
        db.session.commit()
        
        # Return dict with alert flag
        result = log_entry.to_dict()
        result['hotlist_alert'] = alert_flag
        return result

    @staticmethod
    def process_exit(organization_id, log_id):
        """
        Process vehicle exit: set exit time, calculate duration, check overstay.
        """
        log_entry = LPRLog.query.filter_by(id=log_id, organization_id=organization_id).first()
        if not log_entry:
            return None
            
        if log_entry.exit_time:
            return log_entry # Already exited
            
        now = datetime.utcnow()
        log_entry.exit_time = now
        log_entry.status = 'completed' # Mark cycle as complete
        
        # Calculate duration
        duration = now - log_entry.timestamp
        duration_minutes = int(duration.total_seconds() / 60)
        log_entry.duration_minutes = duration_minutes
        
        # Check overstay (Default threshold: 8 hours = 480 mins)
        # In real app, this could be configurable per organization or category
        if duration_minutes > 480:
            log_entry.is_overstay = True
            
        db.session.commit()
        return log_entry

    @staticmethod
    def get_dashboard_stats(organization_id):
        from sqlalchemy import func, and_
        today = datetime.now().date()
        
        # Entries Today (Total logs for today)
        entries_today = LPRLog.query.filter(
            LPRLog.organization_id == organization_id,
            func.date(LPRLog.timestamp) == today
        ).count()
        
        # Security Alerts (Hotlist hits today - status='denied' or just hotlist match)
        # Using status='denied' as a proxy for alerts/blocks
        security_alerts = LPRLog.query.filter(
            LPRLog.organization_id == organization_id,
            LPRLog.status == 'denied',
            func.date(LPRLog.timestamp) == today
        ).count()
        
        # VIP Movements (Whitelist hits today)
        vip_movements = LPRLog.query.filter(
            LPRLog.organization_id == organization_id,
            LPRLog.category == 'whitelist',
            func.date(LPRLog.timestamp) == today
        ).count()
        
        return {
            'entries_today': entries_today,
            'security_alerts': security_alerts,
            'vip_movements': vip_movements,
            'active_cameras': 8 # Mock for now or count distinct source
        }

    @staticmethod
    def get_hotlist(organization_id):
        return LPRHotlist.query.filter_by(
            organization_id=organization_id, 
            is_active=True
        ).order_by(LPRHotlist.created_at.desc()).all()

    @staticmethod
    def add_to_hotlist(organization_id, data):
        new_entry = LPRHotlist(
            organization_id=organization_id,
            vehicle_number=data['vehicle_number'],
            reason=data['reason'],
            fir_number=data.get('fir_number'),
            reporting_officer=data.get('reporting_officer'),
            severity=data.get('severity', 'warning')
        )
        db.session.add(new_entry)
        db.session.commit()
        return new_entry

    @staticmethod
    def remove_from_hotlist(entry_id, organization_id):
        entry = LPRHotlist.query.filter_by(id=entry_id, organization_id=organization_id).first()
        if entry:
            entry.is_active = False # Soft delete
            db.session.commit()
            return True
        return False

    @staticmethod
    def get_whitelist(organization_id):
        return LPRWhitelist.query.filter_by(
            organization_id=organization_id, 
            is_active=True
        ).order_by(LPRWhitelist.created_at.desc()).all()

    @staticmethod
    def add_to_whitelist(organization_id, data):
        new_entry = LPRWhitelist(
            organization_id=organization_id,
            vehicle_number=data['vehicle_number'],
            owner_name=data['owner_name'],
            designation=data.get('designation'),
            department=data.get('department'),
            priority=data.get('priority', 'medium'),
            access_zones=data.get('access_zones', 'all')
        )
        db.session.add(new_entry)
        db.session.commit()
        return new_entry

    @staticmethod
    def remove_from_whitelist(entry_id, organization_id):
        entry = LPRWhitelist.query.filter_by(id=entry_id, organization_id=organization_id).first()
        if entry:
            entry.is_active = False # Soft delete
            db.session.commit()
            return True
        return False

# Instance for easy import
lpr_service = LPRService()
