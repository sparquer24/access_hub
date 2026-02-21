"""
Performance monitoring and profiling utilities
"""

import time
import functools
import logging
from datetime import datetime
from flask import request, g
import psutil
import os
from collections import defaultdict

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Performance monitoring utility"""
    
    def __init__(self):
        self.metrics = defaultdict(list)
        self.thresholds = {
            'slow_query': 1.0,  # seconds
            'slow_request': 2.0,  # seconds
            'memory_warning': 80,  # percent
            'cpu_warning': 80  # percent
        }
    
    def add_metric(self, metric_name, value, metadata=None):
        """Add a performance metric"""
        self.metrics[metric_name].append({
            'value': value,
            'timestamp': datetime.utcnow(),
            'metadata': metadata or {}
        })
    
    def get_system_metrics(self):
        """Get current system metrics"""
        try:
            return {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'active_connections': len(psutil.net_connections())
            }
        except Exception as e:
            logger.warning(f"Could not get system metrics: {e}")
            return {}
    
    def check_thresholds(self, metrics):
        """Check if metrics exceed warning thresholds"""
        warnings = []
        
        if metrics.get('cpu_percent', 0) > self.thresholds['cpu_warning']:
            warnings.append(f"High CPU usage: {metrics['cpu_percent']:.1f}%")
        
        if metrics.get('memory_percent', 0) > self.thresholds['memory_warning']:
            warnings.append(f"High memory usage: {metrics['memory_percent']:.1f}%")
        
        return warnings


def monitor_performance(func):
    """Decorator to monitor function performance"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time
            
            # Log slow functions
            if duration > 1.0:  # Functions taking more than 1 second
                logger.warning(f"Slow function: {func.__name__} took {duration:.3f} seconds")
            else:
                logger.debug(f"Function: {func.__name__} took {duration:.3f} seconds")
    
    return wrapper


def monitor_database_query(func):
    """Decorator to monitor database query performance"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time
            
            # Log slow queries
            threshold = 1.0  # seconds
            if duration > threshold:
                logger.warning(f"Slow database query: {func.__name__} took {duration:.3f} seconds")
                
                # Add to performance metrics
                performance_monitor.add_metric('slow_query', duration, {
                    'function': func.__name__,
                    'args_count': len(args),
                    'kwargs_keys': list(kwargs.keys())
                })
    
    return wrapper


def setup_request_monitoring(app):
    """Set up request-level performance monitoring"""
    
    @app.before_request
    def before_request():
        g.start_time = time.time()
        g.start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            # Handle both float (time.time()) and datetime objects
            start_time = g.start_time
            if isinstance(start_time, datetime):
                duration = (datetime.utcnow() - start_time).total_seconds()
            else:
                duration = time.time() - start_time
            
            # Log slow requests
            if duration > 2.0:  # Requests taking more than 2 seconds
                logger.warning(f"Slow request: {request.method} {request.url} took {duration:.3f} seconds")
            
            # Memory usage
            if hasattr(g, 'start_memory'):
                current_memory = psutil.Process().memory_info().rss / 1024 / 1024
                memory_diff = current_memory - g.start_memory
                
                if memory_diff > 50:  # More than 50MB increase
                    logger.warning(f"High memory usage: {request.method} {request.url} used {memory_diff:.1f} MB")
            
            # Add request metrics
            performance_monitor.add_metric('request_duration', duration, {
                'method': request.method,
                'endpoint': request.endpoint,
                'status_code': response.status_code
            })
        
        return response


class DatabaseQueryMonitor:
    """Monitor database queries for performance issues"""
    
    def __init__(self):
        self.queries = []
        self.slow_query_threshold = 1.0  # seconds
    
    def log_query(self, query, duration, parameters=None):
        """Log a database query"""
        query_info = {
            'query': query,
            'duration': duration,
            'parameters': parameters,
            'timestamp': datetime.utcnow()
        }
        
        self.queries.append(query_info)
        
        # Keep only last 100 queries to prevent memory issues
        if len(self.queries) > 100:
            self.queries = self.queries[-100:]
        
        # Log slow queries
        if duration > self.slow_query_threshold:
            logger.warning(f"Slow query ({duration:.3f}s): {query[:200]}...")
    
    def get_slow_queries(self, limit=10):
        """Get the slowest queries"""
        sorted_queries = sorted(self.queries, key=lambda x: x['duration'], reverse=True)
        return sorted_queries[:limit]
    
    def get_query_stats(self):
        """Get query statistics"""
        if not self.queries:
            return {}
        
        durations = [q['duration'] for q in self.queries]
        return {
            'total_queries': len(self.queries),
            'avg_duration': sum(durations) / len(durations),
            'max_duration': max(durations),
            'min_duration': min(durations),
            'slow_queries': len([d for d in durations if d > self.slow_query_threshold])
        }


class MemoryProfiler:
    """Simple memory profiling utility"""
    
    @staticmethod
    def get_memory_usage():
        """Get current memory usage"""
        try:
            process = psutil.Process()
            return {
                'rss': process.memory_info().rss / 1024 / 1024,  # MB
                'vms': process.memory_info().vms / 1024 / 1024,  # MB
                'percent': process.memory_percent()
            }
        except Exception as e:
            logger.warning(f"Could not get memory usage: {e}")
            return {}
    
    @staticmethod
    def log_memory_usage(context=""):
        """Log current memory usage"""
        memory_info = MemoryProfiler.get_memory_usage()
        if memory_info:
            logger.info(f"Memory usage {context}: RSS={memory_info['rss']:.1f}MB, "
                       f"VMS={memory_info['vms']:.1f}MB, Percent={memory_info['percent']:.1f}%")


# Global instances
performance_monitor = PerformanceMonitor()
db_query_monitor = DatabaseQueryMonitor()


def profile_endpoint(endpoint_name):
    """Decorator to profile specific endpoints"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            start_memory = MemoryProfiler.get_memory_usage()
            
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                end_memory = MemoryProfiler.get_memory_usage()
                
                memory_diff = 0
                if start_memory and end_memory:
                    memory_diff = end_memory['rss'] - start_memory['rss']
                
                logger.info(f"Endpoint {endpoint_name}: {duration:.3f}s, Memory: {memory_diff:+.1f}MB")
                
                performance_monitor.add_metric(f'endpoint_{endpoint_name}', duration, {
                    'memory_diff': memory_diff
                })
        
        return wrapper
    return decorator