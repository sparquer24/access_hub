from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, and_, or_, distinct, case
from ..extensions import db
from ..models import OrganizationVisitor, AttendanceRecord, Employee, Shift, VisitorPreRegistration, VisitorAlert

class VisitorService:
    """
    Service class for visitor management operations
    """

    @staticmethod
    def get_dashboard_stats(organization_id):
        """
        Get visitor statistics for the dashboard
        """
        today = datetime.utcnow().date()
        
        # Get today's visitors count
        entries_today = db.session.query(func.count(OrganizationVisitor.id)).filter(
            OrganizationVisitor.organization_id == organization_id,
            func.date(OrganizationVisitor.check_in_time) == today
        ).scalar() or 0
        
        # Get currently active visitors
        active_visitors = db.session.query(func.count(OrganizationVisitor.id)).filter(
            OrganizationVisitor.organization_id == organization_id,
            OrganizationVisitor.is_checked_in == True,
            OrganizationVisitor.check_out_time == None
        ).scalar() or 0
        
        return {
            'entries_today': entries_today,
            'active_visitors': active_visitors
        }

    @staticmethod
    def get_visitor_trends(organization_id):
        """
        Get visitor trends (weekly and monthly)
        """
        today = datetime.utcnow().date()
        
        # Weekly Activity (Last 7 days)
        weekly_activity = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_name = day.strftime('%a')
            
            count = db.session.query(func.count(OrganizationVisitor.id)).filter(
                OrganizationVisitor.organization_id == organization_id,
                func.date(OrganizationVisitor.check_in_time) == day
            ).scalar() or 0
            
            weekly_activity.append({
                'name': day_name,
                'value': count
            })
            
        # Monthly Trend (Last 6 months)
        monthly_trend = []
        for i in range(5, -1, -1):
            # Calculate the first day of the month i months ago
            target_date = today - relativedelta(months=i)
            month_str = target_date.strftime('%b')
            month_num = target_date.month
            year_num = target_date.year
            
            count = db.session.query(func.count(OrganizationVisitor.id)).filter(
                OrganizationVisitor.organization_id == organization_id,
                func.extract('month', OrganizationVisitor.check_in_time) == month_num,
                func.extract('year', OrganizationVisitor.check_in_time) == year_num
            ).scalar() or 0
            
            monthly_trend.append({
                'name': month_str,
                'value': count
            })
            
        return {
            'weekly_activity': weekly_activity,
            'monthly_trend': monthly_trend
        }

    @staticmethod
    def get_visitors_by_organization(organization_id, page=1, limit=10, from_date=None, to_date=None):
        """
        Return (total, visitors) for an organization with optional check-in date filtering and pagination.
        `from_date` and `to_date` are expected as 'YYYY-MM-DD' strings (or None).
        """
        # Base query for organization
        query = db.session.query(OrganizationVisitor).filter(
            OrganizationVisitor.organization_id == organization_id
        )

        # Apply optional date filters (compare dates only)
        if from_date:
            try:
                from_dt = datetime.strptime(from_date, '%Y-%m-%d').date()
                query = query.filter(func.date(OrganizationVisitor.check_in_time) >= from_dt)
            except Exception:
                raise ValueError('Invalid from_date format. Use YYYY-MM-DD')

        if to_date:
            try:
                to_dt = datetime.strptime(to_date, '%Y-%m-%d').date()
                query = query.filter(func.date(OrganizationVisitor.check_in_time) <= to_dt)
            except Exception:
                raise ValueError('Invalid to_date format. Use YYYY-MM-DD')

        # Pagination and ordering
        try:
            page = int(page) if page else 1
            limit = int(limit) if limit else 10
        except Exception:
            raise ValueError('Invalid pagination parameters')

        if page < 1 or limit < 1:
            raise ValueError('Page and limit must be positive integers')

        total = query.count()
        offset = (page - 1) * limit
        visitors = query.order_by(OrganizationVisitor.check_in_time.desc()).offset(offset).limit(limit).all()

        return total, visitors

    @staticmethod
    def create_visitor(organization_id, data):
        """
        Create and persist a new OrganizationVisitor record.

        Expected `data` keys (common):
          - name or visitor_name
          - mobile_number
          - purpose_of_visit
          - allowed_floor
          - email (optional)
        """
        if not data or not isinstance(data, dict):
            raise ValueError('Missing visitor data')

        name = data.get('name') or data.get('visitor_name')
        mobile = data.get('mobile_number') or data.get('phone') or data.get('phone_number')
        purpose = data.get('purpose_of_visit') or data.get('purpose')
        allowed_floor = data.get('allowed_floor')

        if not name or not mobile or not purpose or not allowed_floor:
            raise ValueError('Missing required visitor fields: name, mobile_number, purpose_of_visit, allowed_floor')

        visitor = OrganizationVisitor(
            organization_id=organization_id,
            visitor_name=name,
            mobile_number=mobile,
            purpose_of_visit=purpose,
            allowed_floor=allowed_floor,
            check_in_time=datetime.utcnow(),
            is_checked_in=True
        )

        # Optional fields
        if data.get('email'):
            visitor.email = data.get('email')
        if data.get('visitor_type'):
            visitor.visitor_type = data.get('visitor_type')
        if 'is_vip' in data:
            try:
                visitor.is_vip = bool(data.get('is_vip'))
            except Exception:
                pass
        if data.get('host_name'):
            visitor.host_name = data.get('host_name')
        if data.get('company_name'):
            visitor.company_name = data.get('company_name')
        if data.get('photo_path'):
            visitor.photo_path = data.get('photo_path')

        # Persist
        db.session.add(visitor)
        db.session.commit()

        return visitor

    @staticmethod
    def get_visitor_alerts(organization_id, visitor_id=None, limit=100):
        """
        Retrieve visitor alerts for an organization or a specific visitor.

        - If `visitor_id` is provided, return alerts for that visitor only.
        - `limit` controls the maximum number of alerts returned (ordered by alert_time desc).
        """
        try:
            limit = int(limit) if limit else 100
        except Exception:
            limit = 100

        query = db.session.query(VisitorAlert).filter(VisitorAlert.organization_id == organization_id)

        if visitor_id:
            query = query.filter(VisitorAlert.visitor_id == visitor_id)

        alerts = query.order_by(VisitorAlert.alert_time.desc()).limit(limit).all()
        return alerts
