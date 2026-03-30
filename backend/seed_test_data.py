#!/usr/bin/env python
"""
Comprehensive seed script to populate test data for attendance and leave requests.
This creates sample data for testing filters and backend APIs.
"""

import os
import sys
from datetime import datetime, date, timedelta
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import AttendanceRecord, LeaveRequest, Employee, Organization

def seed_test_data():
    """Create comprehensive test data"""
    app = create_app()
    
    with app.app_context():
        print("🌱 Starting test data seeding...\n")
        
        # Get organization and employees
        org = Organization.query.first()
        if not org:
            print("❌ No organizations found. Please seed organizations first.")
            return
        
        employees = Employee.query.filter_by(
            organization_id=org.id, 
            deleted_at=None
        ).limit(5).all()
        
        if not employees:
            print(f"❌ No employees found in organization {org.id}.")
            return
        
        print(f"✅ Found {len(employees)} employees")
        print(f"✅ Organization: {org.name}\n")
        
        # ===== SEED ATTENDANCE RECORDS =====
        print("📋 Seeding Attendance Records...")
        
        existing_attendance = AttendanceRecord.query.filter_by(
            organization_id=org.id
        ).count()
        
        if existing_attendance == 0:
            attendance_created = 0
            today = date.today()
            
            # Create 30 days of attendance data
            for i in range(30):
                current_date = today - timedelta(days=i)
                
                # Skip weekends
                if current_date.weekday() >= 5:
                    continue
                
                for emp in employees:
                    # Vary statuses
                    statuses = ['present', 'absent', 'half_day', 'on_leave', 'holiday']
                    status = statuses[hash(f"{emp.id}{current_date}") % len(statuses)]
                    
                    check_in_time = None
                    check_out_time = None
                    work_hours = 0
                    
                    if status == 'present':
                        hour = 8 + (hash(f"{emp.id}{current_date}") % 2)
                        minute = hash(f"{emp.id}{current_date}min") % 60
                        check_in_time = datetime.combine(current_date, datetime.min.time()).replace(
                            hour=hour, minute=minute
                        )
                        
                        checkout_hour = 17 + (hash(f"{emp.id}{current_date}ch") % 2)
                        checkout_minute = hash(f"{emp.id}{current_date}chm") % 60
                        check_out_time = datetime.combine(current_date, datetime.min.time()).replace(
                            hour=checkout_hour, minute=checkout_minute
                        )
                        
                        time_diff = check_out_time - check_in_time
                        work_hours = round(time_diff.total_seconds() / 3600, 2)
                    
                    attendance = AttendanceRecord(
                        id=str(uuid.uuid4()),
                        employee_id=emp.id,
                        organization_id=org.id,
                        date=current_date,
                        check_in_time=check_in_time,
                        check_out_time=check_out_time,
                        status=status,
                        work_hours=work_hours,
                        location_check_in={"latitude": 28.6139, "longitude": 77.2090} if check_in_time else None,
                        location_check_out={"latitude": 28.6139, "longitude": 77.2090} if check_out_time else None,
                        device_info={"type": "mobile", "os": "Android"},
                        face_match_confidence=0.95 if check_in_time else None,
                        liveness_verified=True if check_in_time else False,
                        review_status='auto_approved' if status in ['present', 'absent'] else 'pending',
                        notes='Vacation' if status == 'on_leave' else None
                    )
                    
                    db.session.add(attendance)
                    attendance_created += 1
            
            db.session.commit()
            print(f"   ✅ Created {attendance_created} attendance records")
        else:
            print(f"   ⓘ Attendance records already exist ({existing_attendance}), skipping...")
        
        # ===== SEED LEAVE REQUESTS =====
        print("\n📝 Seeding Leave Requests...")
        
        existing_leaves = LeaveRequest.query.filter_by(
            organization_id=org.id
        ).count()
        
        if existing_leaves == 0:
            leaves_created = 0
            today = date.today()
            
            leave_types = ['sick', 'casual', 'earned', 'unpaid']
            statuses = ['pending', 'approved', 'rejected']
            
            # Create diverse leave requests for testing filters
            for emp_idx, emp in enumerate(employees):
                # Each employee gets different leave types and statuses
                for leave_idx, leave_type in enumerate(leave_types):
                    start_date = today + timedelta(days=10 + (emp_idx * 5) + (leave_idx * 2))
                    end_date = start_date + timedelta(days=2)
                    
                    status = statuses[leave_idx % len(statuses)]
                    
                    total_days = (end_date - start_date).days + 1
                    
                    leave = LeaveRequest(
                        id=str(uuid.uuid4()),
                        employee_id=emp.id,
                        organization_id=org.id,
                        leave_type=leave_type,
                        duration_type='full_day',
                        start_date=start_date,
                        end_date=end_date,
                        total_days=float(total_days),
                        reason=f"Testing {leave_type} leave request",
                        status=status,
                        approval_notes=f"Tested on {datetime.now().strftime('%Y-%m-%d')}"
                    )
                    
                    db.session.add(leave)
                    leaves_created += 1
            
            db.session.commit()
            print(f"   ✅ Created {leaves_created} leave requests")
        else:
            print(f"   ⓘ Leave requests already exist ({existing_leaves}), skipping...")
        
        # ===== SUMMARY =====
        print("\n" + "="*60)
        print("✅ TEST DATA SEEDING COMPLETE!")
        print("="*60)
        print(f"\n📊 Summary:")
        print(f"   Organization: {org.name}")
        print(f"   Employees: {len(employees)}")
        
        final_attendance = AttendanceRecord.query.filter_by(organization_id=org.id).count()
        final_leaves = LeaveRequest.query.filter_by(organization_id=org.id).count()
        
        print(f"   Total Attendance Records: {final_attendance}")
        print(f"   Total Leave Requests: {final_leaves}")
        
        print(f"\n🧪 Ready for API Testing!")
        print(f"\n   Attendance Filters:")
        print(f"      - status: present, absent, half_day, on_leave, holiday")
        print(f"      - start_date: ISO date format (YYYY-MM-DD)")
        print(f"      - end_date: ISO date format (YYYY-MM-DD)")
        print(f"      - review_status: auto_approved, pending, approved, rejected")
        
        print(f"\n   Leave Filters:")
        print(f"      - leave_type: sick, casual, earned, unpaid")
        print(f"      - status: pending, approved, rejected")
        print(f"      - start_date: ISO date format (YYYY-MM-DD)")
        print(f"      - end_date: ISO date format (YYYY-MM-DD)")

if __name__ == '__main__':
    seed_test_data()
