# File: backend/core/middleware.py
"""
Custom middleware for ChurchConnect DBMS
Provides security headers, rate limiting, audit logging, and monitoring
"""

import time
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve
import hashlib

logger = logging.getLogger('core.security')


class SecurityHeadersMiddleware:
    """
    Enhanced security headers middleware
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy
        if not settings.DEBUG:
            csp_policy = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self';"
            )
            response['Content-Security-Policy'] = csp_policy
        
        # Remove server information
        response['Server'] = 'ChurchConnect'
        
        # API-specific headers
        if request.path.startswith('/api/'):
            response['X-API-Version'] = 'v1'
            response['X-Response-Time'] = getattr(request, '_start_time', 0)
        
        return response


class RateLimitMiddleware:
    """
    Advanced rate limiting middleware with IP and user-based limits
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = getattr(settings, 'RATE_LIMIT_SETTINGS', {}).get('ENABLE_RATE_LIMITING', True)

    def __call__(self, request):
        if not self.enabled:
            return self.get_response(request)
        
        # Get client identifier
        client_ip = self.get_client_ip(request)
        user_id = str(request.user.id) if request.user.is_authenticated else None
        
        # Check rate limits
        if self.is_rate_limited(request, client_ip, user_id):
            logger.warning(f"Rate limit exceeded for {client_ip} (user: {user_id}) on {request.path}")
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'detail': 'Too many requests. Please try again later.',
                'retry_after': 60
            }, status=429)
        
        response = self.get_response(request)
        
        # Record successful request
        self.record_request(request, client_ip, user_id)
        
        return response

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

    def is_rate_limited(self, request, client_ip, user_id):
        """Check if request should be rate limited"""
        # Get rate limit for this endpoint
        rate_limit = self.get_rate_limit_for_path(request.path)
        if not rate_limit:
            return False
        
        # Parse rate limit (e.g., "100/hour", "10/minute")
        try:
            limit, period = rate_limit.split('/')
            limit = int(limit)
            
            # Convert period to seconds
            if period == 'second':
                window = 1
            elif period == 'minute':
                window = 60
            elif period == 'hour':
                window = 3600
            elif period == 'day':
                window = 86400
            else:
                return False
        except (ValueError, AttributeError):
            return False
        
        # Check IP-based limit
        ip_key = f"rate_limit_ip_{client_ip}_{request.path}"
        ip_requests = cache.get(ip_key, 0)
        
        if ip_requests >= limit:
            return True
        
        # Check user-based limit (if authenticated)
        if user_id:
            user_key = f"rate_limit_user_{user_id}_{request.path}"
            user_requests = cache.get(user_key, 0)
            
            if user_requests >= limit * 2:  # Users get 2x the limit
                return True
        
        return False

    def record_request(self, request, client_ip, user_id):
        """Record successful request for rate limiting"""
        rate_limit = self.get_rate_limit_for_path(request.path)
        if not rate_limit:
            return
        
        try:
            limit, period = rate_limit.split('/')
            
            # Convert period to seconds
            if period == 'second':
                window = 1
            elif period == 'minute':
                window = 60
            elif period == 'hour':
                window = 3600
            elif period == 'day':
                window = 86400
            else:
                return
        except (ValueError, AttributeError):
            return
        
        # Record IP-based request
        ip_key = f"rate_limit_ip_{client_ip}_{request.path}"
        ip_requests = cache.get(ip_key, 0)
        cache.set(ip_key, ip_requests + 1, window)
        
        # Record user-based request (if authenticated)
        if user_id:
            user_key = f"rate_limit_user_{user_id}_{request.path}"
            user_requests = cache.get(user_key, 0)
            cache.set(user_key, user_requests + 1, window)

    def get_rate_limit_for_path(self, path):
        """Get rate limit configuration for specific path"""
        rate_limits = getattr(settings, 'RATE_LIMIT_SETTINGS', {})
        
        # Specific endpoint limits
        if '/auth/login/' in path:
            return rate_limits.get('LOGIN_RATE_LIMIT', '10/minute')
        elif '/password/reset/' in path:
            return '5/hour'
        elif '/form/' in path or path.endswith('/members/'):
            return rate_limits.get('PUBLIC_FORM_RATE_LIMIT', '10/hour')
        elif path.startswith('/api/'):
            return rate_limits.get('API_RATE_LIMIT', '500/hour')
        
        return rate_limits.get('DEFAULT_RATE_LIMIT', '100/hour')


class AuditMiddleware:
    """
    Comprehensive audit logging middleware
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.enabled = getattr(settings, 'FEATURE_FLAGS', {}).get('ENABLE_AUDIT_LOGGING', True)
        self.sensitive_fields = ['password', 'token', 'secret', 'key', 'authorization']

    def __call__(self, request):
        if not self.enabled:
            return self.get_response(request)
        
        # Record request start time
        request._start_time = time.time()
        
        # Log request
        self.log_request(request)
        
        response = self.get_response(request)
        
        # Log response
        self.log_response(request, response)
        
        return response

    def log_request(self, request):
        """Log incoming request details"""
        # Skip logging for certain paths
        if self.should_skip_logging(request.path):
            return
        
        client_info = {
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200],
            'referer': request.META.get('HTTP_REFERER', '')[:200],
        }
        
        # Log request
        logger.info(f"REQUEST: {request.method} {request.path}", extra={
            'method': request.method,
            'path': request.path,
            'user': str(request.user) if request.user.is_authenticated else 'anonymous',
            'client_info': client_info,
            'content_type': request.content_type,
            'query_params': dict(request.GET),
            'body_size': len(request.body) if hasattr(request, 'body') else 0,
        })

    def log_response(self, request, response):
        """Log response details"""
        if self.should_skip_logging(request.path):
            return
        
        # Calculate response time
        response_time = time.time() - getattr(request, '_start_time', time.time())
        
        # Log response
        logger.info(f"RESPONSE: {response.status_code} {request.path}", extra={
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'response_time': response_time,
            'content_length': len(response.content) if hasattr(response, 'content') else 0,
            'user': str(request.user) if request.user.is_authenticated else 'anonymous',
        })
        
        # Store response time in request for security headers
        request._response_time = f"{response_time:.3f}ms"

    def should_skip_logging(self, path):
        """Determine if path should be skipped from audit logging"""
        skip_paths = [
            '/health/',
            '/favicon.ico',
            '/static/',
            '/media/',
            '/admin/jsi18n/',
        ]
        
        return any(skip_path in path for skip_path in skip_paths)

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


class RequestTimingMiddleware:
    """
    Request timing and performance monitoring middleware
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Calculate response time
        response_time = time.time() - start_time
        
        # Add timing header
        response['X-Response-Time'] = f"{response_time:.3f}s"
        
        # Log slow requests
        if response_time > 2.0:  # Log requests taking more than 2 seconds
            logger.warning(f"SLOW REQUEST: {request.method} {request.path} took {response_time:.3f}s")
        
        return response


class MaintenanceModeMiddleware:
    """
    Maintenance mode middleware
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if maintenance mode is enabled
        maintenance_mode = cache.get('maintenance_mode', False)
        
        if maintenance_mode:
            # Allow superusers to access during maintenance
            if (request.user.is_authenticated and 
                hasattr(request.user, 'role') and 
                request.user.role == 'super_admin'):
                pass
            # Allow health checks
            elif request.path in ['/health/', '/api/health/']:
                pass
            # Return maintenance response for everyone else
            else:
                return JsonResponse({
                    'error': 'System Maintenance',
                    'message': 'The system is currently under maintenance. Please try again later.',
                    'maintenance_mode': True,
                    'estimated_completion': cache.get('maintenance_end_time')
                }, status=503)
        
        return self.get_response(request)


class IPWhitelistMiddleware:
    """
    IP whitelist middleware for admin access
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.admin_whitelist = getattr(settings, 'ADMIN_IP_WHITELIST', [])

    def __call__(self, request):
        # Check if accessing admin
        if request.path.startswith('/admin/') and self.admin_whitelist:
            client_ip = self.get_client_ip(request)
            
            if client_ip not in self.admin_whitelist:
                logger.warning(f"Admin access denied for IP {client_ip}")
                return JsonResponse({
                    'error': 'Access Denied',
                    'message': 'Your IP address is not authorized to access the admin interface.'
                }, status=403)
        
        return self.get_response(request)

    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class CacheControlMiddleware:
    """
    Cache control middleware for API responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Set cache headers based on path
        if request.path.startswith('/api/'):
            if request.method == 'GET':
                # Cache GET requests for 5 minutes
                response['Cache-Control'] = 'private, max-age=300'
            else:
                # Don't cache POST/PUT/DELETE requests
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
        elif request.path.startswith('/static/'):
            # Cache static files for 1 year
            response['Cache-Control'] = 'public, max-age=31536000'
        
        return response