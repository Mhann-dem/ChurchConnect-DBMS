# ================================================================

# File: backend/core/views.py
from django.http import JsonResponse
from django.conf import settings
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import datetime
import sys
import django

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring systems.
    Returns basic system health information.
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': datetime.datetime.now().isoformat(),
            'database': 'connected',
            'version': '1.0.0'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'timestamp': datetime.datetime.now().isoformat(),
            'database': 'disconnected',
            'error': str(e)
        }, status=503)

@api_view(['GET'])
@permission_classes([AllowAny])
def system_status(request):
    """
    Detailed system status information.
    """
    try:
        # Database check
        db_status = 'connected'
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                migration_count = cursor.fetchone()[0]
        except Exception:
            db_status = 'disconnected'
            migration_count = 0
        
        # Get app versions and counts
        from members.models import Member
        from groups.models import Group
        from pledges.models import Pledge
        
        return JsonResponse({
            'status': 'ok',
            'timestamp': datetime.datetime.now().isoformat(),
            'system': {
                'python_version': sys.version,
                'django_version': django.get_version(),
                'debug_mode': settings.DEBUG,
            },
            'database': {
                'status': db_status,
                'migrations_applied': migration_count,
            },
            'statistics': {
                'total_members': Member.objects.count(),
                'total_groups': Group.objects.count(),
                'total_pledges': Pledge.objects.count(),
            },
            'church_info': {
                'name': getattr(settings, 'CHURCH_NAME', 'ChurchConnect'),
                'timezone': settings.TIME_ZONE,
            }
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'timestamp': datetime.datetime.now().isoformat(),
            'error': str(e)
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_version(request):
    """
    API version information.
    """
    return JsonResponse({
        'api_version': '1.0.0',
        'api_name': 'ChurchConnect API',
        'documentation_url': '/api/docs/',
        'endpoints': {
            'members': '/api/v1/members/',
            'groups': '/api/v1/groups/',
            'pledges': '/api/v1/pledges/',
            'families': '/api/v1/families/',
            'auth': '/api/v1/auth/',
            'reports': '/api/v1/reports/',
        }
    })

def custom_404(request, exception):
    """Custom 404 error handler."""
    return JsonResponse({
        'error': 'Not Found',
        'message': 'The requested resource was not found.',
        'status_code': 404
    }, status=404)

def custom_500(request):
    """Custom 500 error handler."""
    return JsonResponse({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred. Please try again later.',
        'status_code': 500
    }, status=500)
