"""
Reports Service Layer
Handles business logic for report generation and data retrieval
"""

from datetime import datetime, timedelta
from sqlalchemy import func, and_
from ..models import (
    AttendanceRecord, 
    LeaveRequest, 
    Employee, 
    Department,
    Organization
)
from ..extensions import db
import logging

logger = logging.getLogger(__name__)


class ReportsService:
    """Service class for handling all report operations"""
    
    @staticmethod
    def get_attendance_report_data(organization_id, employee_id=None, start_date=None, end_date=None):
        """
        Get attendance report data
        
        Args:
            organization_id: Organization ID for filtering
            employee_id: Optional filter by specific employee
            start_date: Optional start date filter (YYYY-MM-DD)
            end_date: Optional end date filter (YYYY-MM-DD)
        
        Returns:
            Dictionary with report data and summary
        """
        try:
            # Build query
            query = AttendanceRecord.query.filter_by(organization_id=organization_id)
            
            # Apply filters
            if employee_id:
                query = query.filter_by(employee_id=employee_id)
            
            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d').date()
                    query = query.filter(AttendanceRecord.date >= start)
                except ValueError:
                    pass
            
            if end_date:
                try:
                    end = datetime.strptime(end_date, '%Y-%m-%d').date()
                    query = query.filter(AttendanceRecord.date <= end)
                except ValueError:
                    pass
            
            records = query.order_by(AttendanceRecord.date.desc()).all()
            
            # Build summary statistics
            summary = {
                'total_records': len(records),
                'present_count': sum(1 for r in records if r.status == 'present'),
                'absent_count': sum(1 for r in records if r.status == 'absent'),
                'half_day_count': sum(1 for r in records if r.status == 'half_day'),
                'on_leave_count': sum(1 for r in records if r.status == 'on_leave'),
                'average_work_hours': round(sum(r.work_hours or 0 for r in records) / len(records), 2) if records else 0,
                'total_employees': len(set(r.employee_id for r in records)),
                'date_range': {
                    'start_date': start_date or 'N/A',
                    'end_date': end_date or 'N/A'
                }
            }
            
            # Build employee statistics
            employee_stats = {}
            for record in records:
                if record.employee_id not in employee_stats:
                    employee_stats[record.employee_id] = {
                        'employee_id': record.employee_id,
                        'name': record.employee.full_name if record.employee else 'Unknown',
                        'employee_code': record.employee.employee_code if record.employee else 'N/A',
                        'department': record.employee.department.name if record.employee and record.employee.department else 'N/A',
                        'present_days': 0,
                        'absent_days': 0,
                        'half_days': 0,
                        'total_work_hours': 0.0,
                        'records': []
                    }
                
                stats = employee_stats[record.employee_id]
                if record.status == 'present':
                    stats['present_days'] += 1
                elif record.status == 'absent':
                    stats['absent_days'] += 1
                elif record.status == 'half_day':
                    stats['half_days'] += 1
                
                stats['total_work_hours'] += record.work_hours or 0
                stats['records'].append({
                    'date': record.date.isoformat() if record.date else None,
                    'check_in': record.check_in_time.isoformat() if record.check_in_time else None,
                    'check_out': record.check_out_time.isoformat() if record.check_out_time else None,
                    'work_hours': record.work_hours,
                    'status': record.status,
                    'notes': record.notes
                })
            
            return {
                'success': True,
                'data': {
                    'summary': summary,
                    'employee_stats': list(employee_stats.values()),
                    'records': [r.to_dict(include_employee=True) for r in records]
                }
            }
        
        except Exception as e:
            logger.error(f"Error fetching attendance report: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'data': None
            }
    
    @staticmethod
    def get_leaves_report_data(organization_id, employee_id=None, start_date=None, end_date=None):
        """
        Get leaves report data
        
        Args:
            organization_id: Organization ID for filtering
            employee_id: Optional filter by specific employee
            start_date: Optional start date filter (YYYY-MM-DD)
            end_date: Optional end date filter (YYYY-MM-DD)
        
        Returns:
            Dictionary with report data and summary
        """
        try:
            # Build query
            query = LeaveRequest.query.filter_by(organization_id=organization_id)
            
            # Apply filters
            if employee_id:
                query = query.filter_by(employee_id=employee_id)
            
            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d').date()
                    query = query.filter(LeaveRequest.start_date >= start)
                except ValueError:
                    pass
            
            if end_date:
                try:
                    end = datetime.strptime(end_date, '%Y-%m-%d').date()
                    query = query.filter(LeaveRequest.end_date <= end)
                except ValueError:
                    pass
            
            records = query.order_by(LeaveRequest.created_at.desc()).all()
            
            # Build summary statistics
            summary = {
                'total_requests': len(records),
                'approved_count': sum(1 for r in records if r.status == 'approved'),
                'pending_count': sum(1 for r in records if r.status == 'pending'),
                'rejected_count': sum(1 for r in records if r.status == 'rejected'),
                'total_approved_days': sum(r.total_days for r in records if r.status == 'approved'),
                'total_pending_days': sum(r.total_days for r in records if r.status == 'pending'),
            }
            
            # Build leave breakdown by type
            leave_types = {}
            for record in records:
                leave_type = record.leave_type
                if leave_type not in leave_types:
                    leave_types[leave_type] = {
                        'count': 0,
                        'approved': 0,
                        'pending': 0,
                        'rejected': 0,
                        'total_days': 0,
                        'approved_days': 0
                    }
                
                leave_types[leave_type]['count'] += 1
                leave_types[leave_type]['total_days'] += record.total_days
                
                if record.status == 'approved':
                    leave_types[leave_type]['approved'] += 1
                    leave_types[leave_type]['approved_days'] += record.total_days
                elif record.status == 'pending':
                    leave_types[leave_type]['pending'] += 1
                elif record.status == 'rejected':
                    leave_types[leave_type]['rejected'] += 1
            
            # Build employee-wise leave stats
            employee_stats = {}
            for record in records:
                if record.employee_id not in employee_stats:
                    employee_stats[record.employee_id] = {
                        'employee_id': record.employee_id,
                        'name': record.employee.full_name if record.employee else 'Unknown',
                        'employee_code': record.employee.employee_code if record.employee else 'N/A',
                        'department': record.employee.department.name if record.employee and record.employee.department else 'N/A',
                        'total_leaves': 0,
                        'total_days': 0,
                        'approved_days': 0,
                        'pending_days': 0,
                        'leaves': []
                    }
                
                stats = employee_stats[record.employee_id]
                stats['total_leaves'] += 1
                stats['total_days'] += record.total_days
                if record.status == 'approved':
                    stats['approved_days'] += record.total_days
                elif record.status == 'pending':
                    stats['pending_days'] += record.total_days
                
                stats['leaves'].append({
                    'id': record.id,
                    'leave_type': record.leave_type,
                    'start_date': record.start_date.isoformat() if record.start_date else None,
                    'end_date': record.end_date.isoformat() if record.end_date else None,
                    'total_days': record.total_days,
                    'status': record.status,
                    'reason': record.reason,
                    'approval_notes': record.approval_notes
                })
            
            return {
                'success': True,
                'data': {
                    'summary': summary,
                    'leave_types': leave_types,
                    'employee_stats': list(employee_stats.values()),
                    'records': [r.to_dict(include_employee=True) for r in records]
                }
            }
        
        except Exception as e:
            logger.error(f"Error fetching leaves report: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'data': None
            }
    
    @staticmethod
    def get_performance_report_data(organization_id, employee_id=None, start_date=None, end_date=None):
        """
        Get performance report data
        
        Args:
            organization_id: Organization ID for filtering
            employee_id: Optional filter by specific employee
            start_date: Optional start date filter (YYYY-MM-DD)
            end_date: Optional end date filter (YYYY-MM-DD)
        
        Returns:
            Dictionary with report data and summary
        """
        try:
            # Get attendance data
            attendance_query = AttendanceRecord.query.filter_by(organization_id=organization_id)
            if employee_id:
                attendance_query = attendance_query.filter_by(employee_id=employee_id)
            
            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d').date()
                    attendance_query = attendance_query.filter(AttendanceRecord.date >= start)
                except ValueError:
                    pass
            
            if end_date:
                try:
                    end = datetime.strptime(end_date, '%Y-%m-%d').date()
                    attendance_query = attendance_query.filter(AttendanceRecord.date <= end)
                except ValueError:
                    pass
            
            attendance_records = attendance_query.all()
            
            # Get leave data
            leave_query = LeaveRequest.query.filter_by(organization_id=organization_id, status='approved')
            if employee_id:
                leave_query = leave_query.filter_by(employee_id=employee_id)
            
            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m-%d').date()
                    leave_query = leave_query.filter(LeaveRequest.start_date >= start)
                except ValueError:
                    pass
            
            if end_date:
                try:
                    end = datetime.strptime(end_date, '%Y-%m-%d').date()
                    leave_query = leave_query.filter(LeaveRequest.end_date <= end)
                except ValueError:
                    pass
            
            leave_records = leave_query.all()
            
            # Calculate performance metrics
            employee_performance = {}
            for record in attendance_records:
                if record.employee_id not in employee_performance:
                    employee_performance[record.employee_id] = {
                        'employee_id': record.employee_id,
                        'name': record.employee.full_name if record.employee else 'Unknown',
                        'employee_code': record.employee.employee_code if record.employee else 'N/A',
                        'department': record.employee.department.name if record.employee and record.employee.department else 'N/A',
                        'present': 0,
                        'total_records': 0,
                        'attendance_percentage': 0.0,
                        'total_work_hours': 0.0,
                        'approved_leaves': 0
                    }
                
                perf = employee_performance[record.employee_id]
                perf['total_records'] += 1
                if record.status == 'present':
                    perf['present'] += 1
                perf['total_work_hours'] += record.work_hours or 0
            
            # Add leave information
            for leave in leave_records:
                if leave.employee_id in employee_performance:
                    employee_performance[leave.employee_id]['approved_leaves'] += leave.total_days
            
            # Calculate attendance percentage
            for emp_id, perf in employee_performance.items():
                if perf['total_records'] > 0:
                    perf['attendance_percentage'] = round((perf['present'] / perf['total_records']) * 100, 2)
            
            summary = {
                'total_employees_evaluated': len(employee_performance),
                'average_attendance': round(sum(p['attendance_percentage'] for p in employee_performance.values()) / len(employee_performance), 2) if employee_performance else 0,
                'average_work_hours': round(sum(p['total_work_hours'] for p in employee_performance.values()) / len(employee_performance), 2) if employee_performance else 0,
            }
            
            return {
                'success': True,
                'data': {
                    'summary': summary,
                    'employee_performance': list(employee_performance.values())
                }
            }
        
        except Exception as e:
            logger.error(f"Error fetching performance report: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'data': None
            }
    
    @staticmethod
    def get_available_reports():
        """Get list of available report types with descriptions"""
        return {
            'success': True,
            'data': [
                {
                    'type': 'attendance',
                    'name': 'Attendance Report',
                    'description': 'View employee attendance records, checkin/checkout times, and work hours',
                    'icon': 'clock',
                    'parameters': ['start_date', 'end_date', 'employee_id', 'department_id']
                },
                {
                    'type': 'leaves',
                    'name': 'Leave Requests Report',
                    'description': 'View leave requests, approvals, and leave balance by type',
                    'icon': 'calendar',
                    'parameters': ['start_date', 'end_date', 'employee_id', 'department_id']
                },
                {
                    'type': 'performance',
                    'name': 'Performance Report',
                    'description': 'Evaluate employee performance based on attendance and work hours',
                    'icon': 'trending-up',
                    'parameters': ['start_date', 'end_date', 'employee_id', 'department_id']
                },
                {
                    'type': 'projects',
                    'name': 'Projects Report',
                    'description': 'View project assignments, completion status, and team allocation',
                    'icon': 'briefcase',
                    'parameters': ['start_date', 'end_date']
                },
                {
                    'type': 'summary',
                    'name': 'Executive Summary',
                    'description': 'High-level overview of organizational metrics and KPIs',
                    'icon': 'bar-chart',
                    'parameters': ['start_date', 'end_date']
                }
            ]
        }
