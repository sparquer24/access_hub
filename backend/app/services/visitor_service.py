from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, and_, or_, distinct, case, desc
from ..extensions import db
from ..models import OrganizationVisitor, AttendanceRecord, Employee, Shift, VisitorHistoryDetails, Image, VisitorMovementLog, Alert
import uuid
from flask import current_app

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
    def get_visitors_overview(org_id):
        today = date.today()

        # 1️ Active Visitors (currently checked in)
        active_visitors = db.session.query(func.count(VisitorHistoryDetails.id)) \
            .filter(
                VisitorHistoryDetails.organization_id == org_id,
                VisitorHistoryDetails.check_out_time.is_(None)
            ).scalar() or 0
        # 2️ Total Entries Today
        total_entries_today = db.session.query(func.count(VisitorHistoryDetails.id)) \
            .filter(
                VisitorHistoryDetails.organization_id == org_id,
                func.date(VisitorHistoryDetails.created_at) == today
            ).scalar() or 0
 
        # 4️ Total Visitors (master count)
        total_visitors = db.session.query(func.count(OrganizationVisitor.id)) \
            .filter(
                OrganizationVisitor.organization_id == org_id
            ).scalar() or 0
        # 6️ Visitor Type Breakdown (active visitors only)
        visitor_type_rows = db.session.query(
            VisitorHistoryDetails.visitor_type,
            func.count(VisitorHistoryDetails.id)
        ).filter(
            VisitorHistoryDetails.organization_id == org_id,
            VisitorHistoryDetails.check_out_time.is_(None)
        ).group_by(
            VisitorHistoryDetails.visitor_type
        ).all()

        visitor_types_breakdown = {
            row[0]: row[1] for row in visitor_type_rows
        }

        return {
            "active_visitors": active_visitors,
            "total_entries_today": total_entries_today,
            "total_visitors": total_visitors,
            "visitor_types_breakdown": visitor_types_breakdown
        }
    

    @staticmethod
    def create_visitor(organization_id, data):
        """
        Create and persist a new OrganizationVisitor record.

        Expected `data` keys:
          - visitor_name or name
          - mobile_number or phone or phone_number
          - email (optional)
          - gender (optional)
        """
        if not data or not isinstance(data, dict):
            raise ValueError('Missing visitor data')

        name = data.get('visitor_name') or data.get('name')
        mobile = data.get('mobile_number') or data.get('phone') or data.get('phone_number')
        email = data.get('email')
        gender = data.get('gender')

        if not name or not mobile:
            raise ValueError('Missing required visitor fields: visitor_name and mobile_number')

        visitor = OrganizationVisitor(
            organization_id=organization_id,
            visitor_name=name,
            mobile_number=mobile,
            email=email,
            gender=gender
        )

        # Persist
        db.session.add(visitor)
        db.session.commit()

        return visitor

    @staticmethod
    def get_visitor_alerts(organization_id, filters=None):
        """
        Retrieve visitor alerts for an organization.
        
        Uses the Alert model from alerts.py for unified platform alerts.
        
        Args:
            organization_id: Organization ID
            filters: Optional dict with filter criteria {
                visitor_id: str,
                unacknowledged_only: bool,
                alert_type: str,
                date_from: date,
                date_to: date,
                limit: int,
                offset: int
            }
            
        Returns:
            List of Alert objects
        """
        try:
            if filters is None:
                filters = {}
            
            # Build query for alerts
            query = db.session.query(Alert).filter(
                Alert.organization_id == organization_id
            )
            
            # Filter by visitor if provided
            if filters.get('visitor_id'):
                query = query.filter(Alert.visitor_id == filters['visitor_id'])
            
            # Filter by acknowledgment status
            if filters.get('unacknowledged_only'):
                query = query.filter(Alert.alert_status == 'yet_to_handle')
            
            # Filter by alert type
            if filters.get('alert_type'):
                query = query.filter(Alert.alert_type == filters['alert_type'])
            
            # Filter by date range
            if filters.get('date_from'):
                query = query.filter(Alert.alert_time >= filters['date_from'])
            
            if filters.get('date_to'):
                query = query.filter(Alert.alert_time <= filters['date_to'])
            
            # Order by most recent first
            query = query.order_by(Alert.alert_time.desc())
            
            # Apply pagination
            offset = filters.get('offset', 0)
            limit = filters.get('limit', 50)
            
            alerts = query.offset(offset).limit(limit).all()
            
            return alerts
            
        except Exception as e:
            current_app.logger.exception('Failed to get visitor alerts')
            return []

    @staticmethod
    def acknowledge_alert(organization_id, alert_id, user_id):
        """
        Acknowledge a visitor alert.
        
        Args:
            organization_id: Organization ID
            alert_id: Alert ID to acknowledge
            user_id: User ID who acknowledged the alert
            
        Returns:
            Updated alert dictionary
            
        Raises:
            ValueError: If alert not found or already handled
        """
        try:
            alert = db.session.query(Alert).filter(
                Alert.id == alert_id,
                Alert.organization_id == organization_id
            ).first()
            
            if not alert:
                raise ValueError(f'Alert {alert_id} not found')
            
            if alert.alert_status == 'handled':
                raise ValueError('Alert already handled')
            
            # Update alert status
            alert.alert_status = 'handled'
            alert.handled_by = user_id
            alert.handled_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'id': alert.id,
                'alert_status': alert.alert_status,
                'handled_by': alert.handled_by,
                'handled_at': alert.handled_at.isoformat()
            }
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception('Failed to acknowledge alert')
            raise

    @staticmethod
    def create_visitor_history_record(organization_id, visitor_id, data):
        """
        Create a record in visitor_history_details.
        
        Expected `data` keys (required):
          - purpose_of_visit (required)
          - allowed_floor (required)
        
        Expected `data` keys (optional):
          - visitor_type
          - host_name
          - host_number
          - allowed_tower
          - duration_date_from
          - duration_date_to
          - special_instructions
          - company_name
          - company_address
          - is_recurring
          - expected_duration_hours
          - work_description
          - delivery_package_count
          - delivery_recipient_name

        Returns the created VisitorHistoryDetails instance.
        Raises ValueError for invalid input or Exception on DB errors.
        """
        if not organization_id:
            raise ValueError('organization_id is required')
        if not visitor_id:
            raise ValueError('visitor_id is required')
        if not data.get('purpose_of_visit'):
            raise ValueError('purpose_of_visit is required')
        if not data.get('allowed_floor'):
            raise ValueError('allowed_floor is required')

        try:
            # Parse duration dates if provided
            duration_from = None
            duration_to = None
            
            if data.get('duration_date_from'):
                try:
                    if isinstance(data.get('duration_date_from'), str):
                        duration_from = datetime.fromisoformat(data.get('duration_date_from').replace('Z', '+00:00'))
                    else:
                        duration_from = data.get('duration_date_from')
                except Exception:
                    pass
                    
            if data.get('duration_date_to'):
                try:
                    if isinstance(data.get('duration_date_to'), str):
                        duration_to = datetime.fromisoformat(data.get('duration_date_to').replace('Z', '+00:00'))
                    else:
                        duration_to = data.get('duration_date_to')
                except Exception:
                    pass
            
            # Prepare metadata for optional fields
            metadata = {
                'special_instructions': data.get('special_instructions'),
                'company_name': data.get('company_name'),
                'company_address': data.get('company_address'),
                'is_recurring': data.get('is_recurring', False),
                'expected_duration_hours': data.get('expected_duration_hours'),
                'work_description': data.get('work_description'),
                'delivery_package_count': data.get('delivery_package_count'),
                'delivery_recipient_name': data.get('delivery_recipient_name')
            }
            
            # Remove None values to keep metadata clean
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            rec = VisitorHistoryDetails(
                id=str(uuid.uuid4()),
                organization_id=organization_id,
                visitor_id=str(visitor_id),
                visitor_type=data.get('visitor_type'),
                host_name=data.get('host_name'),
                host_number=data.get('host_number'),
                purpose_of_visit=data.get('purpose_of_visit'),
                allowed_floor=data.get('allowed_floor'),
                allowed_tower=data.get('allowed_tower'),
                duration_date_from=duration_from,
                duration_date_to=duration_to,
                visit_metadata=metadata if metadata else None,
                created_at=datetime.utcnow()
            )
            db.session.add(rec)
            db.session.commit()
            return rec
        except Exception as e:
            current_app.logger.exception('Failed to create visitor history record')
            db.session.rollback()
            raise
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
        # # Get all visitor IDs for this organization
        # visitors = db.session.query(OrganizationVisitor.id).filter_by(
        #     organization_id=org_id
        # ).all()
        # visitor_ids = [v[0] for v in visitors]
        
        # query = VisitorMovementLog.query.filter(
        #     VisitorMovementLog.visitor_id.in_(visitor_ids)
        # )
        
        # if filters:
        #     if filters.get('visitor_id'):
        #         query = query.filter_by(visitor_id=filters['visitor_id'])
            
        #     if filters.get('floor'):
        #         query = query.filter_by(floor=filters['floor'])
            
        #     if filters.get('date_from'):
        #         query = query.filter(VisitorMovementLog.entry_time >= filters['date_from']) # type: ignore
            
        #     if filters.get('date_to'):
        #         query = query.filter(VisitorMovementLog.entry_time <= filters['date_to'])
        
        # # Order by most recent first
        # query = query.order_by(desc(VisitorMovementLog.entry_time))
        
        # # Apply pagination
        # offset = filters.get('offset', 0) if filters else 0
        # limit = filters.get('limit', 50) if filters else 50
        
        return {
                # 'total': query.count(),
                # 'logs': query.offset(offset).limit(limit).all()
            
        }    
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
    def get_visitor(organization_id, visitor_id):
        """
        Get a specific visitor by ID.
        Raises ValueError if visitor not found.
        """
        visitor = db.session.query(OrganizationVisitor).filter(
            OrganizationVisitor.id == visitor_id,
            OrganizationVisitor.organization_id == organization_id
        ).first()
        
        if not visitor:
            raise ValueError(f'Visitor {visitor_id} not found in organization {organization_id}')
        
        return visitor

    @staticmethod
    def update_visitor(organization_id, visitor_id, data):
        """
        Update visitor information.
        
        Expected `data` keys:
          - visitor_name
          - email
          - gender
          - mobile_number
        """
        visitor = VisitorService.get_visitor(organization_id, visitor_id)
        
        if not visitor:
            raise ValueError(f'Visitor not found: {visitor_id}')
        
        # Update only allowed fields
        if data.get('visitor_name'):
            visitor.visitor_name = data.get('visitor_name')
        if data.get('email') is not None:
            visitor.email = data.get('email')
        if data.get('gender') is not None:
            visitor.gender = data.get('gender')
        if data.get('mobile_number'):
            visitor.mobile_number = data.get('mobile_number')
        
        db.session.commit()
        return visitor

    @staticmethod
    def delete_visitor(organization_id, visitor_id):
        """
        Delete a visitor record.
        Raises ValueError if visitor not found.
        """
        visitor = VisitorService.get_visitor(organization_id, visitor_id)
        
        if not visitor:
            raise ValueError(f'Visitor not found: {visitor_id}')
        
        db.session.delete(visitor)
        db.session.commit()

    @staticmethod
    def save_visitor_profile_picture(organization_id, visitor_id, image_base64, file_name=None, mime_type='image/jpeg', captured_by=None):
        """
        Save or update visitor profile picture via Images table.
        
        Args:
            organization_id: Organization ID
            visitor_id: Visitor ID
            image_base64: Base64 encoded image data
            file_name: Optional file name
            mime_type: Image MIME type (default: 'image/jpeg')
            captured_by: Optional user ID who captured the image
        
        Returns:
            Image object
        """
        # Verify visitor exists
        visitor = VisitorService.get_visitor(organization_id, visitor_id)
        if not visitor:
            raise ValueError(f'Visitor not found: {visitor_id}')
        
        # Set any existing profile pictures to non-primary
        existing_images = db.session.query(Image).filter(
            Image.entity_type == 'visitor',
            Image.entity_id == visitor_id,
            Image.primary == True
        ).all()
        
        for img in existing_images:
            img.primary = False
        
        # Create new image record
        image = Image(
            entity_type='visitor',
            entity_id=visitor_id,
            organization_id=organization_id,
            image_base64=image_base64,
            image_type='profile',
            file_name=file_name,
            mime_type=mime_type,
            primary=True,
            is_active=True,
            captured_by=captured_by
        )
        
        db.session.add(image)
        db.session.commit()
        
        return image

    @staticmethod
    def get_visitor_profile_picture(organization_id, visitor_id):
        """
        Get visitor profile picture from Images table.
        
        Returns:
            Image object or None if not found
        """
        image = db.session.query(Image).filter(
            Image.entity_type == 'visitor',
            Image.entity_id == visitor_id,
            Image.organization_id == organization_id,
            Image.primary == True,
            Image.is_active == True,
            Image.image_type == 'profile'
        ).first()
        
        return image

    @staticmethod
    def delete_visitor_profile_picture(organization_id, visitor_id):
        """
        Delete visitor profile picture.
        
        Args:
            organization_id: Organization ID
            visitor_id: Visitor ID
        """
        image = VisitorService.get_visitor_profile_picture(organization_id, visitor_id)
        
        if not image:
            raise ValueError(f'Profile picture not found for visitor {visitor_id}')
        
        # Soft delete
        image.deleted = True
        image.is_active = False
        db.session.commit()

    @staticmethod
    def get_all_visitor_images(organization_id, visitor_id):
        """
        Get all images (profile and other) for a visitor.
        
        Returns:
            List of Image objects
        """
        images = db.session.query(Image).filter(
            Image.entity_type == 'visitor',
            Image.entity_id == visitor_id,
            Image.organization_id == organization_id,
            Image.is_active == True
        ).order_by(Image.primary.desc(), Image.created_at.desc()).all()
        
        return images

    @staticmethod
    def get_visitor_by_phone(organization_id, phone_number):
        """
        Get visitor profile by phone number.
        Used for quick lookup when visitor enters at entry point.
        
        Args:
            organization_id: Organization ID
            phone_number: Visitor phone number
        
        Returns:
            Visitor object with organization_id and all basic details
            None if not found
        """
        visitor = db.session.query(OrganizationVisitor).filter(
            OrganizationVisitor.organization_id == organization_id,
            OrganizationVisitor.mobile_number == phone_number
        ).first()
        
        return visitor

    @staticmethod
    def get_visitor_with_history(organization_id, phone_number):
        """
        Get visitor profile along with their complete visit history.
        Used for auto-filling form with previous visit details.
        
        Args:
            organization_id: Organization ID
            phone_number: Visitor phone number
        
        Returns:
            Dict with visitor details and history records
            Returns None if visitor not found
        """
        visitor = VisitorService.get_visitor_by_phone(organization_id, phone_number)
        
        if not visitor:
            return None
        
        # Get latest visit history records
        history_records = db.session.query(VisitorHistoryDetails).filter(
            VisitorHistoryDetails.organization_id == organization_id,
            VisitorHistoryDetails.visitor_id == visitor.id
        ).order_by(VisitorHistoryDetails.created_at.desc()).all()
        
        return {
            'visitor': visitor,
            'history_records': history_records
        }

    @staticmethod
    def get_visitor_history_by_phone(organization_id, phone_number, limit=10):
        """
        Fetch all visitor history records by phone number.
        
        Args:
            organization_id: Organization ID
            phone_number: Visitor phone number
            limit: Maximum records to return
        
        Returns:
            List of history records or empty list if visitor not found
        """
        visitor = VisitorService.get_visitor_by_phone(organization_id, phone_number)
        
        if not visitor:
            return []
        
        records = db.session.query(VisitorHistoryDetails).filter(
            VisitorHistoryDetails.organization_id == organization_id,
            VisitorHistoryDetails.visitor_id == visitor.id
        ).order_by(VisitorHistoryDetails.created_at.desc()).limit(limit).all()
        
        return records

    @staticmethod
    def get_visitor_history_search(organization_id, phone_number=None, limit=10):
        """
        Search visitor history by phone number.
        
        Args:
            organization_id: Organization ID
            phone_number: Phone number to search
            limit: Maximum records to return
        
        Returns:
            List of history records with visitor details
        """
        if not phone_number:
            return []
        
        # Join visitor and history records
        records = db.session.query(VisitorHistoryDetails, OrganizationVisitor).filter(
            VisitorHistoryDetails.organization_id == organization_id,
            VisitorHistoryDetails.visitor_id == OrganizationVisitor.id,
            OrganizationVisitor.mobile_number == phone_number
        ).order_by(VisitorHistoryDetails.created_at.desc()).limit(limit).all()
        
        return records

    @staticmethod
    def save_visitor_history(organization_id, visitor_id, data):
        """
        Save or update visitor history record.
        
        Expected data keys:
          - visitor_type
          - host_name
          - host_number
          - purpose_of_visit
          - allowed_floor
          - allowed_tower (optional)
          - duration_date_from (optional)
          - duration_date_to (optional)
        
        Returns:
            VisitorHistoryDetails object
        """
        # This is essentially same as create_visitor_history_record
        # Provided as an alias for consistency
        return VisitorService.create_visitor_history_record(
            organization_id, 
            visitor_id, 
            data
        )
    @staticmethod
    def get_visitor_analytics(organization_id, period='monthly'):  # monthly|weekly|hourly
        """
        Get visitor analytics for dashboard charts.
        
        Args:
            organization_id: Organization ID
            period: 'monthly' | 'weekly' | 'hourly'
        
        Returns:
            Dictionary with analytics data based on period
        """
        if period == 'monthly':
            return VisitorService._get_monthly_analytics(organization_id)
        elif period == 'weekly':
            return VisitorService._get_weekly_analytics(organization_id)
        elif period == 'hourly':
            return VisitorService._get_hourly_analytics(organization_id)
        else:
            raise ValueError(f"Invalid period: {period}. Must be 'monthly', 'weekly', or 'hourly'")

    @staticmethod
    def _get_monthly_analytics(organization_id):
        """
        Get monthly visitor analytics for the last 12 months.
        
        Returns:
            {
                "monthly_gender": [
                    { "label": "Jan", "male": 40, "female": 30 },
                    { "label": "Feb", "male": 35, "female": 32 },
                    ...
                ]
            }
        """
        today = datetime.utcnow()
        months_data = []
        
        # Get data for last 12 months
        for i in range(11, -1, -1):
            month_start = today.replace(day=1) - relativedelta(months=i)
            if i == 0:
                month_end = today
            else:
                month_end = (today.replace(day=1) - relativedelta(months=i-1)).replace(day=1) - timedelta(days=1)
            
            month_label = month_start.strftime('%b')
            
            # Gender analytics
            gender_data = db.session.query(
                OrganizationVisitor.gender,
                func.count(OrganizationVisitor.id).label('count')
            ).join(
                VisitorHistoryDetails,
                OrganizationVisitor.id == VisitorHistoryDetails.visitor_id
            ).filter(
                OrganizationVisitor.organization_id == organization_id,
                VisitorHistoryDetails.check_in_time >= month_start,
                VisitorHistoryDetails.check_in_time <= month_end
            ).group_by(OrganizationVisitor.gender).all()
            
            gender_dict = {row[0] or 'unknown': row[1] for row in gender_data}
            
            months_data.append({
                'label': month_label,
                'gender': gender_dict
            })
        
        # Transform data for front-end
        monthly_gender = []
        
        for data in months_data:
            monthly_gender.append({
                'label': data['label'],
                'male': data['gender'].get('male', 0),
                'female': data['gender'].get('female', 0)
            })
        
        return {
            'monthly_gender': monthly_gender
        }

    @staticmethod
    def _get_weekly_analytics(organization_id):
        """
        Get weekly visitor analytics by day of week (last 7 days).
        
        Returns:
            {
                "weekly_gender": [
                    { "label": "Mon", "male": 10, "female": 8 },
                    { "label": "Tue", "male": 12, "female": 11 },
                    ...
                ]
            }
        """
        today = datetime.utcnow()
        days_data = []
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        
        # Get data for last 7 days
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            day_label = day_names[day.weekday()]
            
            # Gender analytics
            gender_data = db.session.query(
                OrganizationVisitor.gender,
                func.count(OrganizationVisitor.id).label('count')
            ).join(
                VisitorHistoryDetails,
                OrganizationVisitor.id == VisitorHistoryDetails.visitor_id
            ).filter(
                OrganizationVisitor.organization_id == organization_id,
                VisitorHistoryDetails.check_in_time >= day_start,
                VisitorHistoryDetails.check_in_time <= day_end
            ).group_by(OrganizationVisitor.gender).all()
            
            gender_dict = {row[0] or 'unknown': row[1] for row in gender_data}
            
            days_data.append({
                'label': day_label,
                'gender': gender_dict
            })
        
        # Transform data for front-end
        weekly_gender = []
        
        for data in days_data:
            weekly_gender.append({
                'label': data['label'],
                'male': data['gender'].get('male', 0),
                'female': data['gender'].get('female', 0)
            })
        
        return {
            'weekly_gender': weekly_gender
        }

    @staticmethod
    def _get_hourly_analytics(organization_id):
        """
        Get hourly visitor analytics for the last 24 hours.
        
        Returns:
            {
                "hourly_gender": [
                    { "label": "00:00", "male": 2, "female": 1 },
                    { "label": "01:00", "male": 3, "female": 2 },
                    ...
                ]
            }
        """
        today = datetime.utcnow()
        hours_data = []
        
        # Get data for last 24 hours
        for i in range(23, -1, -1):
            hour_start = today.replace(minute=0, second=0, microsecond=0) - timedelta(hours=i)
            hour_end = hour_start + timedelta(hours=1) - timedelta(seconds=1)
            
            hour_label = hour_start.strftime('%H:%M')
            
            # Gender analytics
            gender_data = db.session.query(
                OrganizationVisitor.gender,
                func.count(OrganizationVisitor.id).label('count')
            ).join(
                VisitorHistoryDetails,
                OrganizationVisitor.id == VisitorHistoryDetails.visitor_id
            ).filter(
                OrganizationVisitor.organization_id == organization_id,
                VisitorHistoryDetails.check_in_time >= hour_start,
                VisitorHistoryDetails.check_in_time <= hour_end
            ).group_by(OrganizationVisitor.gender).all()
            
            gender_dict = {row[0] or 'unknown': row[1] for row in gender_data}
            
            hours_data.append({
                'label': hour_label,
                'gender': gender_dict
            })
        
        # Transform data for front-end
        hourly_gender = []
        
        for data in hours_data:
            hourly_gender.append({
                'label': data['label'],
                'male': data['gender'].get('male', 0),
                'female': data['gender'].get('female', 0)
            })
        
        return {
            'hourly_gender': hourly_gender
        }