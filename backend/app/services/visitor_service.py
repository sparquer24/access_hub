from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, and_, or_, distinct, case
from ..extensions import db
from ..models import OrganizationVisitor, AttendanceRecord, Employee, Shift, VisitorHistoryDetail, Image
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
    def get_visitor_alerts(organization_id, visitor_id=None, limit=100):
        """
        Retrieve visitor alerts for an organization or a specific visitor.
        
        Note: Visitor alerts functionality has been removed from the schema.
        This method returns an empty list for backward compatibility.
        """
        # Legacy method - VisitorAlert model no longer exists
        return []

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

        Returns the created VisitorHistoryDetail instance.
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
            
            rec = VisitorHistoryDetail(
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
        history_records = db.session.query(VisitorHistoryDetail).filter(
            VisitorHistoryDetail.organization_id == organization_id,
            VisitorHistoryDetail.visitor_id == visitor.id
        ).order_by(VisitorHistoryDetail.created_at.desc()).all()
        
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
        
        records = db.session.query(VisitorHistoryDetail).filter(
            VisitorHistoryDetail.organization_id == organization_id,
            VisitorHistoryDetail.visitor_id == visitor.id
        ).order_by(VisitorHistoryDetail.created_at.desc()).limit(limit).all()
        
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
        records = db.session.query(VisitorHistoryDetail, OrganizationVisitor).filter(
            VisitorHistoryDetail.organization_id == organization_id,
            VisitorHistoryDetail.visitor_id == OrganizationVisitor.id,
            OrganizationVisitor.mobile_number == phone_number
        ).order_by(VisitorHistoryDetail.created_at.desc()).limit(limit).all()
        
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
            VisitorHistoryDetail object
        """
        # This is essentially same as create_visitor_history_record
        # Provided as an alias for consistency
        return VisitorService.create_visitor_history_record(
            organization_id, 
            visitor_id, 
            data
        )