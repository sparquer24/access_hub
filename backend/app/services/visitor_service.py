from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, and_, or_, distinct, case
from ..extensions import db
from ..models import OrganizationVisitor, AttendanceRecord, Employee, Shift

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
