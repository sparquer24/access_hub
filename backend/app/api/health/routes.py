"""
Health check and system monitoring endpoints
"""

import os
import psutil
import time
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from sqlalchemy import text
from app import db
from app.utils.responses import success_response, error_response
from flask_jwt_extended import jwt_required
from app.utils.decorators import role_required
from app.models.user import User
from app.models.employee import Employee
from app.models.department import Department
from app.models.organization import Organization
import logging

logger = logging.getLogger(__name__)

health_bp = Blueprint('health', __name__, url_prefix='/api/health')


@health_bp.route('/status', methods=['GET'])
def basic_health_check():
    """Basic health check endpoint"""
    try:
        # Check database connectivity
        db.session.execute(text('SELECT 1'))
        
        return success_response({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'service': 'VMS Backend'
        })
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return error_response(
            message='Health check failed',
            status_code=503,
            error_type='service_unavailable'
        )


@health_bp.route('/detailed', methods=['GET'])
@jwt_required()
@role_required(['super_admin', 'org_admin'])
def detailed_health_check():
    """Detailed health check with system metrics"""
    try:
        health_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'VMS Backend',
            'version': '1.0.0',
            'status': 'healthy',
            'checks': {}
        }
        
        # Database connectivity check
        try:
            start_time = time.time()
            result = db.session.execute(text('SELECT COUNT(*) FROM users'))
            user_count = result.scalar()
            db_response_time = time.time() - start_time
            
            health_data['checks']['database'] = {
                'status': 'healthy',
                'response_time_ms': round(db_response_time * 1000, 2),
                'user_count': user_count
            }
        except Exception as e:
            health_data['checks']['database'] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health_data['status'] = 'degraded'
        
        # System metrics
        try:
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            health_data['checks']['system'] = {
                'status': 'healthy',
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory': {
                    'total_gb': round(memory.total / (1024**3), 2),
                    'available_gb': round(memory.available / (1024**3), 2),
                    'percent_used': memory.percent
                },
                'disk': {
                    'total_gb': round(disk.total / (1024**3), 2),
                    'free_gb': round(disk.free / (1024**3), 2),
                    'percent_used': round((disk.used / disk.total) * 100, 2)
                }
            }
            
            # Check for resource warnings
            if memory.percent > 85:
                health_data['checks']['system']['warnings'] = health_data['checks']['system'].get('warnings', [])
                health_data['checks']['system']['warnings'].append('High memory usage')
                health_data['status'] = 'degraded'
            
            if (disk.used / disk.total) * 100 > 90:
                health_data['checks']['system']['warnings'] = health_data['checks']['system'].get('warnings', [])
                health_data['checks']['system']['warnings'].append('Low disk space')
                health_data['status'] = 'degraded'
                
        except Exception as e:
            health_data['checks']['system'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Application metrics
        try:
            health_data['checks']['application'] = {
                'status': 'healthy',
                'uptime_seconds': time.time() - psutil.Process().create_time(),
                'memory_usage_mb': round(psutil.Process().memory_info().rss / (1024**2), 2),
                'open_files': len(psutil.Process().open_files()),
                'threads': psutil.Process().num_threads()
            }
        except Exception as e:
            health_data['checks']['application'] = {
                'status': 'error',
                'error': str(e)
            }
        
        return success_response(health_data)
    
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        return error_response(
            message='Detailed health check failed',
            status_code=503,
            error_type='service_unavailable'
        )


@health_bp.route('/stats', methods=['GET'])
@jwt_required()
@role_required(['super_admin', 'org_admin'])
def system_stats():
    """System statistics and metrics"""
    try:
        stats = {
            'timestamp': datetime.utcnow().isoformat(),
            'database_stats': {},
            'user_stats': {},
            'system_stats': {}
        }
        
        # Database statistics
        try:
            stats['database_stats'] = {
                'total_users': db.session.query(User).count(),
                'active_users': db.session.query(User).filter(User.is_active == True).count(),
                'total_employees': db.session.query(Employee).count(),
                'total_departments': db.session.query(Department).count(),
                'total_organizations': db.session.query(Organization).count()
            }
            
            # Recent activity
            recent_users = db.session.query(User).filter(
                User.created_at >= datetime.utcnow() - timedelta(days=7)
            ).count()
            stats['database_stats']['new_users_last_week'] = recent_users
            
        except Exception as e:
            stats['database_stats']['error'] = str(e)
        
        # User role statistics
        try:
            from app.models.user_role import UserRole
            from app.models.role import Role
            
            role_stats = {}
            roles = db.session.query(Role).all()
            for role in roles:
                count = db.session.query(UserRole).filter(UserRole.role_id == role.id).count()
                role_stats[role.name] = count
            
            stats['user_stats'] = {
                'roles_distribution': role_stats,
                'total_role_assignments': sum(role_stats.values())
            }
            
        except Exception as e:
            stats['user_stats']['error'] = str(e)
        
        # System performance stats
        try:
            process = psutil.Process()
            stats['system_stats'] = {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent,
                'process_memory_mb': round(process.memory_info().rss / (1024**2), 2),
                'process_cpu_percent': process.cpu_percent(),
                'process_threads': process.num_threads(),
                'system_load': os.getloadavg() if hasattr(os, 'getloadavg') else 'N/A'
            }
        except Exception as e:
            stats['system_stats']['error'] = str(e)
        
        return success_response(stats)
    
    except Exception as e:
        logger.error(f"System stats failed: {e}")
        return error_response(
            message='Failed to retrieve system stats',
            status_code=500
        )


@health_bp.route('/logs', methods=['GET'])
@jwt_required()
@role_required(['super_admin'])
def get_recent_logs():
    """Get recent application logs"""
    try:
        log_level = request.args.get('level', 'INFO')
        limit = min(int(request.args.get('limit', 100)), 1000)  # Max 1000 lines
        
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        log_files = {
            'info': os.path.join(log_dir, 'app_info.log'),
            'error': os.path.join(log_dir, 'app_error.log'),
            'audit': os.path.join(log_dir, 'audit.log')
        }
        
        logs_data = {}
        
        for log_type, log_file in log_files.items():
            if os.path.exists(log_file):
                try:
                    with open(log_file, 'r') as f:
                        lines = f.readlines()
                        # Get last N lines
                        recent_lines = lines[-limit:] if len(lines) > limit else lines
                        logs_data[log_type] = {
                            'total_lines': len(lines),
                            'recent_lines': len(recent_lines),
                            'logs': [line.strip() for line in recent_lines]
                        }
                except Exception as e:
                    logs_data[log_type] = {'error': str(e)}
            else:
                logs_data[log_type] = {'error': 'Log file not found'}
        
        return success_response({
            'timestamp': datetime.utcnow().isoformat(),
            'requested_limit': limit,
            'logs': logs_data
        })
    
    except Exception as e:
        logger.error(f"Failed to retrieve logs: {e}")
        return error_response(
            message='Failed to retrieve logs',
            status_code=500
        )


@health_bp.route('/database/test', methods=['POST'])
@jwt_required()
@role_required(['super_admin'])
def test_database_operations():
    """Test database operations"""
    try:
        test_results = {
            'timestamp': datetime.utcnow().isoformat(),
            'tests': {}
        }
        
        # Test basic queries
        try:
            start_time = time.time()
            user_count = db.session.query(User).count()
            query_time = time.time() - start_time
            
            test_results['tests']['basic_query'] = {
                'status': 'pass',
                'response_time_ms': round(query_time * 1000, 2),
                'result': f'{user_count} users found'
            }
        except Exception as e:
            test_results['tests']['basic_query'] = {
                'status': 'fail',
                'error': str(e)
            }
        
        # Test transaction
        try:
            start_time = time.time()
            with db.session.begin():
                # Simple transaction test
                db.session.execute(text('SELECT 1'))
            transaction_time = time.time() - start_time
            
            test_results['tests']['transaction'] = {
                'status': 'pass',
                'response_time_ms': round(transaction_time * 1000, 2)
            }
        except Exception as e:
            test_results['tests']['transaction'] = {
                'status': 'fail',
                'error': str(e)
            }
        
        # Test complex query
        try:
            start_time = time.time()
            result = db.session.query(User).join(Employee).limit(10).all()
            complex_query_time = time.time() - start_time
            
            test_results['tests']['complex_query'] = {
                'status': 'pass',
                'response_time_ms': round(complex_query_time * 1000, 2),
                'result': f'{len(result)} user-employee records found'
            }
        except Exception as e:
            test_results['tests']['complex_query'] = {
                'status': 'fail',
                'error': str(e)
            }
        
        # Overall status
        failed_tests = [test for test, result in test_results['tests'].items() if result.get('status') == 'fail']
        test_results['overall_status'] = 'fail' if failed_tests else 'pass'
        test_results['failed_tests'] = failed_tests
        
        return success_response(test_results)
    
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return error_response(
            message='Database test failed',
            status_code=500
        )


@health_bp.route('/performance', methods=['GET'])
@jwt_required()
@role_required(['super_admin', 'org_admin'])
def performance_metrics():
    """Get performance metrics"""
    try:
        # Import performance monitor
        from app.utils.performance import performance_monitor, db_query_monitor
        
        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'system_metrics': performance_monitor.get_system_metrics(),
            'query_stats': db_query_monitor.get_query_stats(),
            'slow_queries': db_query_monitor.get_slow_queries(5),
            'warnings': []
        }
        
        # Check for performance warnings
        warnings = performance_monitor.check_thresholds(metrics['system_metrics'])
        metrics['warnings'] = warnings
        
        return success_response(metrics)
    
    except Exception as e:
        logger.error(f"Performance metrics failed: {e}")
        return error_response(
            message='Failed to retrieve performance metrics',
            status_code=500
        )


def register_health_routes(app):
    """Register health check routes with the Flask app"""
    app.register_blueprint(health_bp)