from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, and_, or_, distinct, case, desc

from ..extensions import db
from ..models import (
    OrganizationVisitor, VisitorAlert, VisitorMovementLog, VisitorHistoryDetails
)

class VisitorService:
    """
    Service class for visitor management operations
    """

    @staticmethod
    def check_in_visitor(org_id, visitor_data):
        """
        Check-in a visitor. Creates visitor record if new, and creates history record.
        
        Args:
            org_id: Organization ID
            visitor_data: Dict with visitor info {
                name, phone, email, gender, 
                visitor_type, host_name, host_phone, 
                purpose_of_visit, allowed_floor, allowed_tower,
                from_date, to_date
            }
        
        Returns:
            Tuple of (visitor, history_record) or raises exception
        """
        try:
            # Check if visitor already exists (by phone and org)
            visitor = OrganizationVisitor.query.filter_by(
                organization_id=org_id,
                phone=visitor_data['phone']
            ).first()
            
            # Create new visitor if doesn't exist
            if not visitor:
                visitor = OrganizationVisitor(
                    organization_id=org_id,
                    name=visitor_data['name'],
                    phone=visitor_data['phone'],
                    email=visitor_data.get('email'),
                    gender=visitor_data.get('gender')
                )
                db.session.add(visitor)
                db.session.flush()  # Get the visitor ID
            
            # Create history record for this visit
            history = VisitorHistoryDetails(
                visitor_id=visitor.id,
                organization_id=org_id,
                visitor_type=visitor_data.get('visitor_type', 'guest'),
                host_name=visitor_data.get('host_name'),
                host_number=visitor_data.get('host_phone'),
                purpose_of_visit=visitor_data['purpose_of_visit'],
                allowed_floor=visitor_data['allowed_floor'],
                allowed_tower=visitor_data.get('allowed_tower'),
                from_date=visitor_data['from_date'],
                to_date=visitor_data.get('to_date'),
                check_in_time=datetime.utcnow(),
                is_checked_in=True
            )
            db.session.add(history)
            db.session.commit()
            
            return visitor, history
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Check-in failed: {str(e)}")

    @staticmethod
    def check_out_visitor(org_id, visit_history_id):
        """
        Check-out a visitor.
        
        Args:
            org_id: Organization ID
            visit_history_id: History record ID
        
        Returns:
            Updated history record or raises exception
        """
        try:
            history = VisitorHistoryDetails.query.filter_by(
                id=visit_history_id,
                organization_id=org_id
            ).first()
            
            if not history:
                raise Exception("Visit history not found")
            
            if history.check_out_time:
                raise Exception("Visitor already checked out")
            
            history.check_out_time = datetime.utcnow()
            history.is_checked_in = False
            db.session.commit()
            
            return history
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Check-out failed: {str(e)}")
        

    @staticmethod
    def get_dashboard_stats(org_id):
        """
        Get dashboard statistics for visitors.
        
        Args:
            org_id: Organization ID
        
        Returns:
            Dict with stats {
                active_visitors: int,
                total_entries_today: int,
                total_visitors: int,
                active_alerts: int,
                logged_movements: int
            }
        """
        try:
            active_visitors = db.session.query(func.count(VisitorHistoryDetails.id)).filter(
                VisitorHistoryDetails.organization_id == org_id,    
                VisitorHistoryDetails.is_checked_in == True
            ).scalar() or 0
            print("Active Visitors:", active_visitors)
            
            return {
                'active_visitors': active_visitors,
                # 'total_entries_today': total_entries_today,
                # 'total_visitors': total_visitors,
                # 'active_alerts': active_alerts,
                # 'logged_movements': logged_movements
            }
            
        except Exception as e:
            print(f"Error getting dashboard stats: {e}")
            raise Exception(f"Failed to get dashboard stats: {str(e)}")

    @staticmethod
    def get_visitor_trends(org_id):
        """
        Get visitor trends data for the last 30 days.
        
        Args:
            org_id: Organization ID
        Returns:
            Dict with trends data {
                daily_entries: list of {date, count},
                visitor_type_breakdown: dict of {visitor_type: count}
            }
        """
        try:
            today = datetime.utcnow().date()
            thirty_days_ago = today - timedelta(days=30)
            
            # Daily entries for last 30 days
            daily_entries = db.session.query(
                func.date(VisitorHistoryDetails.check_in_time).label('date'),
                func.count(VisitorHistoryDetails.id).label('count')
            ).filter(
                VisitorHistoryDetails.organization_id == org_id,
                VisitorHistoryDetails.check_in_time >= thirty_days_ago
            ).group_by(func.date(VisitorHistoryDetails.check_in_time)).order_by(func.date(VisitorHistoryDetails.check_in_time)).all()
            
            daily_entries_data = [{'date': str(date), 'count': count} for date, count in daily_entries]
            
            # Visitor type breakdown for last 30 days
            visitor_type_breakdown = db.session.query(
                VisitorHistoryDetails.visitor_type,
                func.count(VisitorHistoryDetails.id)
            ).filter(
                VisitorHistoryDetails.organization_id == org_id,
                VisitorHistoryDetails.check_in_time >= thirty_days_ago
            ).group_by(VisitorHistoryDetails.visitor_type).all()
            
            visitor_type_data = {vtype: count for vtype, count in visitor_type_breakdown}
            
            return {
                'daily_entries': daily_entries_data,
                'visitor_type_breakdown': visitor_type_data
            }
            
        except Exception as e:
            raise Exception(f"Failed to get visitor trends: {str(e)}")

    @staticmethod
    def create_alert(org_id, visitor_id, alert_type, current_floor, allowed_floor, details=None):
        """
        Create an alert for visitor activity.
        
        Args:
            org_id: Organization ID
            visitor_id: Visitor ID
            alert_type: Type of alert (floor_violation, overstay, etc.)
            current_floor: Current floor of visitor
            allowed_floor: Allowed floor(s) for visitor
            details: Additional details as dict
        
        Returns:
            Alert record
        """
        try:
            alert = VisitorAlert(
                visitor_id=visitor_id,
                organization_id=org_id,
                alert_type=alert_type,
                current_floor=current_floor,
                allowed_floor=allowed_floor,
                details=details or {}
            )
            db.session.add(alert)
            db.session.commit()
            
            return alert
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Alert creation failed: {str(e)}")

    @staticmethod
    def log_visitor_movement(visitor_id, floor, exit_time=None):
        """
        Log visitor movement to a floor.
        
        Args:
            visitor_id: Visitor ID
            floor: Floor number/name
            exit_time: Optional exit time from this floor
        
        Returns:
            Movement log record
        """
        try:
            movement = VisitorMovementLog(
                visitor_id=visitor_id,
                floor=floor,
                exit_time=exit_time
            )
            db.session.add(movement)
            db.session.commit()
            
            return movement
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Movement log failed: {str(e)}")

    @staticmethod
    def get_visitor_alerts(org_id, filters=None):
        """
        Get all alerts for an organization.
        
        Args:
            org_id: Organization ID
            filters: Optional dict with filter criteria {
                unacknowledged_only: bool,
                alert_type: str,
                date_from: date,
                date_to: date,
                limit: int,
                offset: int
            }
        
        Returns:
            List of alert records
        """
        query = VisitorAlert.query.filter_by(organization_id=org_id)
        
        if filters:
            if filters.get('unacknowledged_only'):
                query = query.filter_by(acknowledged=False)
            
            if filters.get('alert_type'):
                query = query.filter_by(alert_type=filters['alert_type'])
            
            if filters.get('date_from'):
                query = query.filter(VisitorAlert.alert_time >= filters['date_from'])
            
            if filters.get('date_to'):
                query = query.filter(VisitorAlert.alert_time <= filters['date_to'])
        
        # Order by most recent first
        query = query.order_by(desc(VisitorAlert.alert_time))
        
        # Apply pagination
        offset = filters.get('offset', 0) if filters else 0
        limit = filters.get('limit', 50) if filters else 50
        
        return query.offset(offset).limit(limit).all()

    @staticmethod
    def get_visitor_logs(org_id, filters=None):
        """
        Get visitor movement logs (visitor_logs).
        
        Args:
            org_id: Organization ID (for visitor filtering)
            filters: Optional dict with filter criteria {
                visitor_id: str,
                floor: str,
                date_from: date,
                date_to: date,
                limit: int,
                offset: int
            }
        
        Returns:
            List of movement log records
        """
        # Get all visitor IDs for this organization
        visitors = db.session.query(OrganizationVisitor.id).filter_by(
            organization_id=org_id
        ).all()
        visitor_ids = [v[0] for v in visitors]
        
        query = VisitorMovementLog.query.filter(
            VisitorMovementLog.visitor_id.in_(visitor_ids)
        )
        
        if filters:
            if filters.get('visitor_id'):
                query = query.filter_by(visitor_id=filters['visitor_id'])
            
            if filters.get('floor'):
                query = query.filter_by(floor=filters['floor'])
            
            if filters.get('date_from'):
                query = query.filter(VisitorMovementLog.entry_time >= filters['date_from'])
            
            if filters.get('date_to'):
                query = query.filter(VisitorMovementLog.entry_time <= filters['date_to'])
        
        # Order by most recent first
        query = query.order_by(desc(VisitorMovementLog.entry_time))
        
        # Apply pagination
        offset = filters.get('offset', 0) if filters else 0
        limit = filters.get('limit', 50) if filters else 50
        
        return query.offset(offset).limit(limit).all()

    @staticmethod
    def get_active_visitors(org_id):
        """
        Get list of currently checked-in visitors for an organization.
        
        Args:
            org_id: Organization ID
            
        Returns:
            List of active visitor history records with visitor details.
        """
        try:
            return VisitorHistoryDetails.query.filter_by(
                organization_id=org_id,
                is_checked_in=True
            ).order_by(desc(VisitorHistoryDetails.check_in_time)).all()
        except Exception as e:
            raise Exception(f"Failed to get active visitors: {str(e)}")

    @staticmethod
    def get_overview_stats(org_id):
        """
        Get overview statistics for visitors.
        
        Args:
            org_id: Organization ID
        
        Returns:
            Dict with overview stats {
                active_visitors: int,
                total_entries_today: int,
                total_visitors: int,
                active_alerts: int,
                logged_movements: int,
                visitor_types_breakdown: dict
            }
        """
        try:
            today = datetime.utcnow().date()
            
            # Active visitors (checked in, not checked out)
            active_visitors = db.session.query(func.count(VisitorHistoryDetails.id)).filter(
                VisitorHistoryDetails.organization_id == org_id,
                VisitorHistoryDetails.is_checked_in == True,
                VisitorHistoryDetails.check_in_time >= datetime(today.year, today.month, today.day)
            ).scalar() or 0
            
            # Total entries today
            total_entries_today = db.session.query(func.count(VisitorHistoryDetails.id)).filter(
                VisitorHistoryDetails.organization_id == org_id,
                VisitorHistoryDetails.check_in_time >= datetime(today.year, today.month, today.day)
            ).scalar() or 0
            
            # Total unique visitors
            total_visitors = db.session.query(func.count(distinct(OrganizationVisitor.id))).filter(
                OrganizationVisitor.organization_id == org_id
            ).scalar() or 0
            
            # Active unacknowledged alerts
            active_alerts = db.session.query(func.count(VisitorAlert.id)).filter(
                VisitorAlert.organization_id == org_id,
                VisitorAlert.acknowledged == False
            ).scalar() or 0
            
            # Total logged movements today
            logged_movements = db.session.query(func.count(VisitorMovementLog.id)).filter(
                VisitorMovementLog.entry_time >= datetime(today.year, today.month, today.day)
            ).scalar() or 0
            
            # Visitor types breakdown
            visitor_types = db.session.query(
                VisitorHistoryDetails.visitor_type,
                func.count(VisitorHistoryDetails.id)
            ).filter(
                VisitorHistoryDetails.organization_id == org_id,
                VisitorHistoryDetails.check_in_time >= datetime(today.year, today.month, today.day)
            ).group_by(VisitorHistoryDetails.visitor_type).all()
            
            visitor_types_breakdown = {vtype: count for vtype, count in visitor_types}
            
            return {
                'active_visitors': active_visitors,
                'total_entries_today': total_entries_today,
                'total_visitors': total_visitors,
                'active_alerts': active_alerts,
                'logged_movements': logged_movements,
                'visitor_types_breakdown': visitor_types_breakdown
            }
            
        except Exception as e:
            raise Exception(f"Failed to get overview stats: {str(e)}")

    @staticmethod
    def get_visitor_history(org_id, visitor_id):
        """
        Get visit history for a specific visitor.
        
        Args:
            org_id: Organization ID
            visitor_id: Visitor ID
        
        Returns:
            List of history records for this visitor
        """
        return VisitorHistoryDetails.query.filter_by(
            organization_id=org_id,
            visitor_id=visitor_id
        ).order_by(desc(VisitorHistoryDetails.created_at)).all()

    @staticmethod
    def acknowledge_alert(org_id, alert_id):
        """
        Acknowledge an alert.
        
        Args:
            org_id: Organization ID
            alert_id: Alert ID
        
        Returns:
            Updated alert record
        """
        try:
            alert = VisitorAlert.query.filter_by(
                id=alert_id,
                organization_id=org_id
            ).first()
            
            if not alert:
                raise Exception("Alert not found")
            
            alert.acknowledged = True
            alert.acknowledged_at = datetime.utcnow()
            db.session.commit()
            
            return alert
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to acknowledge alert: {str(e)}")

    @staticmethod
    def search_visitors(org_id, search_query, limit=10, offset=0):
        """
        Search visitors by name, phone, or email.
        """
        query = OrganizationVisitor.query.filter_by(organization_id=org_id)
        if search_query:
            query = query.filter(or_(
                OrganizationVisitor.name.ilike(f'%{search_query}%'),
                OrganizationVisitor.phone.ilike(f'%{search_query}%'),
                OrganizationVisitor.email.ilike(f'%{search_query}%')
            ))
        return query.offset(offset).limit(limit).all()

    @staticmethod
    def list_visitors(org_id, page=1, per_page=20):
        """
        Get paginated list of visitors for an organization.
        """
        return OrganizationVisitor.query.filter_by(
            organization_id=org_id
        ).order_by(OrganizationVisitor.name).paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def update_visitor(org_id, visitor_id, data):
        """
        Update visitor master data.
        """
        try:
            visitor = OrganizationVisitor.query.filter_by(
                id=visitor_id, 
                organization_id=org_id
            ).first()
            if not visitor:
                raise Exception("Visitor not found")
            
            if 'name' in data: visitor.name = data['name']
            if 'email' in data: visitor.email = data['email']
            if 'gender' in data: visitor.gender = data['gender']
            if 'phone' in data: visitor.phone = data['phone']
            
            db.session.commit()
            return visitor
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to update visitor: {str(e)}")

    @staticmethod
    def delete_visitor(org_id, visitor_id):
        """
        Delete a visitor record (and all related data via cascades).
        """
        try:
            visitor = OrganizationVisitor.query.filter_by(
                id=visitor_id, 
                organization_id=org_id
            ).first()
            if not visitor:
                raise Exception("Visitor not found")
            
            db.session.delete(visitor)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to delete visitor: {str(e)}")
