"""
Business logic for Attendance management.
"""

from sqlalchemy import or_, and_, case
from ..extensions import db
from ..models import AttendanceRecord, Employee
from ..utils.exceptions import NotFoundError, ConflictError, BadRequestError
from datetime import datetime, date, timedelta


class AttendanceService:
    """Service class for attendance operations"""
    
    @staticmethod
    def check_in(data, current_user):
        """Check-in an employee"""
        employee_id = data['employee_id']
        employee = Employee.query.filter_by(id=employee_id, deleted_at=None).first()
        
        if not employee:
            raise NotFoundError('Employee')
        
        # Check if already checked in today
        today = date.today()
        existing = AttendanceRecord.query.filter_by(
            employee_id=employee_id,
            date=today
        ).first()
        
        if existing and existing.check_in_time:
            raise ConflictError('Employee already checked in today')
        
        # Create or update attendance record
        if existing:
            attendance = existing
            attendance.check_in_time = datetime.utcnow()
        else:
            attendance = AttendanceRecord(
                employee_id=employee_id,
                organization_id=employee.organization_id,
                date=today,
                check_in_time=datetime.utcnow(),
                status='present'
            )
            db.session.add(attendance)
        
        # Update optional fields
        if data.get('camera_id'):
            attendance.camera_id = data['camera_id']
        if data.get('location'):
            attendance.location_check_in = data['location']
        if data.get('device_info'):
            attendance.device_info = data['device_info']
        if data.get('face_match_confidence'):
            attendance.face_match_confidence = data['face_match_confidence']
        if data.get('liveness_verified'):
            attendance.liveness_verified = data['liveness_verified']
        
        db.session.commit()
        
        return attendance
    
    @staticmethod
    def check_out(data, current_user):
        """Check-out an employee"""
        employee_id = data['employee_id']
        employee = Employee.query.filter_by(id=employee_id, deleted_at=None).first()
        
        if not employee:
            raise NotFoundError('Employee')
        
        # Find today's attendance record
        today = date.today()
        attendance = AttendanceRecord.query.filter_by(
            employee_id=employee_id,
            date=today
        ).first()
        
        if not attendance:
            raise BadRequestError('No check-in record found for today')
        
        if not attendance.check_in_time:
            raise BadRequestError('Employee has not checked in today')
        
        if attendance.check_out_time:
            raise ConflictError('Employee already checked out today')
        
        # Update check-out time
        attendance.check_out_time = datetime.utcnow()
        
        # Calculate work hours
        time_diff = attendance.check_out_time - attendance.check_in_time
        attendance.work_hours = round(time_diff.total_seconds() / 3600, 2)
        
        # Update optional fields
        if data.get('camera_id'):
            attendance.camera_id = data['camera_id']
        if data.get('location'):
            attendance.location_check_out = data['location']
        if data.get('device_info') and not attendance.device_info:
            attendance.device_info = data['device_info']
        
        db.session.commit()
        
        return attendance
    
    @staticmethod
    def get_attendance(attendance_id):
        """Get attendance record by ID"""
        attendance = AttendanceRecord.query.filter_by(id=attendance_id).first()
        
        if not attendance:
            raise NotFoundError('Attendance record')
        
        return attendance
    
    @staticmethod
    def list_attendance(filters, organization_id=None):
        """List attendance records with filters and pagination"""
        query = AttendanceRecord.query
        needs_employee_join = False
        
        # Apply tenant isolation
        if organization_id:
            query = query.filter_by(organization_id=organization_id)
        
        # Apply filters
        if filters.get('organization_id'):
            query = query.filter_by(organization_id=filters['organization_id'])
        
        if filters.get('employee_id'):
            query = query.filter_by(employee_id=filters['employee_id'])
        
        # Check if we need to join with Employee table
        if filters.get('department_id') or filters.get('search'):
            needs_employee_join = True
        
        # Perform join if needed
        if needs_employee_join:
            query = query.join(Employee)
            
            # Apply department filter
            if filters.get('department_id'):
                query = query.filter(Employee.department_id == filters['department_id'])
            
            # Apply search filter
            if filters.get('search'):
                search = f"%{filters['search']}%"
                query = query.filter(
                    or_(
                        Employee.full_name.ilike(search),
                        Employee.employee_code.ilike(search)
                    )
                )
            
            # Ensure we only select AttendanceRecord entities
            query = query.with_entities(AttendanceRecord)
        
        if filters.get('start_date'):
            query = query.filter(AttendanceRecord.date >= filters['start_date'])
        
        if filters.get('end_date'):
            query = query.filter(AttendanceRecord.date <= filters['end_date'])
        
        if filters.get('status'):
            query = query.filter_by(status=filters['status'])
        
        if filters.get('review_status'):
            query = query.filter_by(review_status=filters['review_status'])
        
        # Order by date desc
        query = query.order_by(AttendanceRecord.date.desc())
        
        return query
    
    @staticmethod
    def update_attendance(attendance_id, data):
        """Update an attendance record"""
        attendance = AttendanceService.get_attendance(attendance_id)
        
        # Update fields
        for key, value in data.items():
            setattr(attendance, key, value)
        
        # Recalculate work hours if check-in or check-out time changed
        if attendance.check_in_time and attendance.check_out_time:
            time_diff = attendance.check_out_time - attendance.check_in_time
            attendance.work_hours = round(time_diff.total_seconds() / 3600, 2)
        
        attendance.updated_at = datetime.utcnow()
        db.session.commit()
        
        return attendance
    
    @staticmethod
    def delete_attendance(attendance_id):
        """Delete an attendance record"""
        attendance = AttendanceService.get_attendance(attendance_id)
        
        # Hard delete (attendance records don't have soft delete)
        db.session.delete(attendance)
        db.session.commit()
        
        return True
    
    @staticmethod
    def approve_attendance(attendance_id, data, current_user):
        """Approve or reject an attendance record"""
        attendance = AttendanceService.get_attendance(attendance_id)
        
        attendance.review_status = data['review_status']
        
        if data.get('notes'):
            attendance.notes = data['notes']
        
        attendance.approved_by = current_user.get('id')
        attendance.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return attendance

    @staticmethod
    def get_organization_attendance_summary(organization_id, start_date, end_date, filters=None):
        """Return aggregated attendance analytics for an organization.

        Returns a dict with daily series, summary stats and distributions.
        """
        from sqlalchemy import func, distinct
        from ..models import AttendanceRecord, Employee, Shift, Department

        if filters is None:
            filters = {}

        # Parse dates (expect date objects or ISO strings)
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Active employee count (respect filters like department/employment_type)
        emp_q = db.session.query(func.count(Employee.id)).filter(
            Employee.organization_id == organization_id,
            Employee.is_active.is_(True)
        )
        if filters.get('department_id'):
            emp_q = emp_q.filter(Employee.department_id == filters['department_id'])
        if filters.get('employment_type'):
            emp_q = emp_q.filter(Employee.employment_type == filters['employment_type'])

        total_active = emp_q.scalar() or 0

        # Daily present and late counts
        ar = AttendanceRecord
        # base attendance query
        base_q = db.session.query(
            ar.date.label('date'),
            func.count(distinct(ar.employee_id)).label('present_count'),
            func.sum(case((ar.check_in_time != None, 1), else_=0)).label('records_with_checkin'),
            func.avg(ar.work_hours).label('avg_work_hours')
        ).filter(
            ar.organization_id == organization_id,
            ar.date >= start_date,
            ar.date <= end_date
        )

        if filters.get('department_id'):
            base_q = base_q.join(Employee).filter(Employee.department_id == filters['department_id'])
        if filters.get('employment_type'):
            base_q = base_q.join(Employee).filter(Employee.employment_type == filters['employment_type'])

        base_q = base_q.group_by(ar.date).order_by(ar.date)

        daily = []
        try:
            rows = base_q.all()
        except Exception:
            db.session.rollback()
            rows = []

        date_map = { }
        for r in rows:
            date_map[r.date.isoformat()] = {
                'date': r.date.isoformat(),
                'present': int(r.present_count or 0),
                'late': 0,  # late needs separate calculation
                'avg_work_hours': float(r.avg_work_hours or 0)
            }

        # Calculate late counts per day by comparing check_in_time to shift start_time + grace
        # Join AttendanceRecord -> Employee -> Shift and compute late where possible
        late_q = db.session.query(
            ar.date.label('date'),
            func.count(distinct(ar.employee_id)).label('late_count')
        ).join(Employee, Employee.id == ar.employee_id).outerjoin(Shift, Shift.id == Employee.shift_id)
        late_q = late_q.filter(
            ar.organization_id == organization_id,
            ar.date >= start_date,
            ar.date <= end_date,
            ar.check_in_time != None,
            Shift.id != None  # Only count records where shift exists
        )
        # late condition: check_in_time > (date + shift.start_time + grace)
        # perform as numeric comparison using extract
        late_q = late_q.filter(
            func.extract('hour', ar.check_in_time) * 60 + func.extract('minute', ar.check_in_time) > (
                func.extract('hour', Shift.start_time) * 60 + func.extract('minute', Shift.start_time) + Shift.grace_period_minutes
            )
        ).group_by(ar.date).order_by(ar.date)

        try:
            late_rows = late_q.all()
        except Exception as e:
            print(f"[get_organization_attendance_summary] Error calculating late counts: {e}")
            db.session.rollback()
            late_rows = []

        for r in late_rows:
            key = r.date.isoformat()
            if key in date_map:
                date_map[key]['late'] = int(r.late_count or 0)
            else:
                date_map[key] = {'date': key, 'present': 0, 'late': int(r.late_count or 0), 'avg_work_hours': 0}

        # Build series covering full range
        cur = start_date
        while cur <= end_date:
            key = cur.isoformat()
            entry = date_map.get(key, {'date': key, 'present': 0, 'late': 0, 'avg_work_hours': 0})
            # absent estimation
            entry['absent'] = max(0, total_active - entry['present']) if total_active > 0 else 0
            daily.append(entry)
            cur = cur + timedelta(days=1)

        # Summary metrics
        total_present = sum(d['present'] for d in daily)
        total_late = sum(d['late'] for d in daily)
        # average work hours across days (weighted average)
        hours_list = [d['avg_work_hours'] for d in daily if d.get('avg_work_hours')]
        avg_work_hours = round(sum(hours_list) / len(hours_list), 1) if hours_list else 0
        days_count = (end_date - start_date).days + 1

        avg_attendance_rate = round((total_present / (total_active * days_count) * 100), 1) if total_active and days_count else 0
        on_time_rate = round(((total_present - total_late) / total_present * 100), 1) if total_present else 0

        # Employment type distribution
        et_q = db.session.query(Employee.employment_type, func.count(Employee.id)).filter(Employee.organization_id == organization_id)
        if filters.get('department_id'):
            et_q = et_q.filter(Employee.department_id == filters['department_id'])
        et_q = et_q.group_by(Employee.employment_type)
        try:
            et_rows = et_q.all()
        except Exception:
            db.session.rollback()
            et_rows = []

        employment_type_distribution = [{'type': r[0] or 'Unknown', 'count': int(r[1])} for r in et_rows]

        # Department distribution
        dept_q = db.session.query(Department.name, func.count(Employee.id)).join(Employee, Employee.department_id == Department.id).filter(Department.organization_id == organization_id)
        dept_q = dept_q.group_by(Department.name)
        try:
            dept_rows = dept_q.all()
        except Exception:
            db.session.rollback()
            dept_rows = []

        department_distribution = [{'department': r[0] or 'Unassigned', 'count': int(r[1])} for r in dept_rows]

        payload = {
            'organization_id': organization_id,
            'date_range': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
            'summary': {
                'avg_attendance_rate': avg_attendance_rate,
                'on_time_rate': on_time_rate,
                'avg_work_hours': avg_work_hours,
                'coverage': f"{sum(1 for d in daily if d['present']>0)}/{total_active}"
            },
            'series': daily,
            'employment_type_distribution': employment_type_distribution,
            'department_distribution': department_distribution,
            'total_active_employees': total_active
        }

        return payload

    @staticmethod
    def get_department_attendance_stats(organization_id, date_str=None):
        """
        Get attendance statistics broken down by department.
        Returns list of {name, rate, total, present}
        """
        from sqlalchemy import func, distinct, case
        from ..models import Department, Employee, AttendanceRecord
        
        target_date = datetime.utcnow().date()
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                pass
                
        # 1. Get all departments with employee counts
        dept_query = db.session.query(
            Department.id,
            Department.name,
            func.count(Employee.id).label('total_employees')
        ).outerjoin(Employee, and_(
            Employee.department_id == Department.id,
            Employee.is_active.is_(True),
            Employee.deleted_at.is_(None)
        )).filter(
            Department.organization_id == organization_id
        ).group_by(Department.id, Department.name).all()
        
        results = []
        
        for dept in dept_query:
            if dept.total_employees == 0:
                results.append({
                    'name': dept.name,
                    'rate': 0,
                    'total': 0,
                    'present': 0
                })
                continue
                
            # 2. Get present count for this department on target date
            present_count = db.session.query(func.count(distinct(AttendanceRecord.employee_id))).join(
                Employee, Employee.id == AttendanceRecord.employee_id
            ).filter(
                Employee.department_id == dept.id,
                AttendanceRecord.organization_id == organization_id,
                AttendanceRecord.date == target_date,
                AttendanceRecord.check_in_time.isnot(None)
            ).scalar() or 0
            
            rate = round((present_count / dept.total_employees) * 100)
            
            results.append({
                'name': dept.name,
                'rate': rate,
                'total': dept.total_employees,
                'present': present_count
            })
            
        # Sort by rate desc
        results.sort(key=lambda x: x['rate'], reverse=True)
        
        return results
