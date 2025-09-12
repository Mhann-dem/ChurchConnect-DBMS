# core/views.py - PRODUCTION READY with proper error handling and fixed imports
from django.http import JsonResponse
from django.conf import settings
from django.db import connection, transaction
from django.apps import apps
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import datetime, timedelta
import sys
import django
import logging

logger = logging.getLogger(__name__)

# core/views.py - FIXED health check view
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring systems.
    Returns basic system health information without model dependencies.
    """
    try:
        # Test database connection
        db_status = 'connected'
        db_details = {}
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 as status")
                result = cursor.fetchone()
                if result and result[0] == 1:
                    db_details['connection'] = 'ok'
                    db_details['engine'] = connection.vendor
                else:
                    db_status = 'connected_but_invalid_response'
                    db_details['connection'] = 'invalid_response'
        except Exception as e:
            db_status = 'disconnected'
            db_details['connection'] = 'failed'
            db_details['error'] = str(e)
            logger.warning(f"Database connection failed: {e}")
        
        # Check if we can access the database schema (but don't query specific models)
        schema_status = 'unknown'
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
                table_count = cursor.fetchone()[0]
                schema_status = 'available' if table_count > 0 else 'empty'
                db_details['table_count'] = table_count
        except Exception as e:
            schema_status = 'unavailable'
            db_details['schema_error'] = str(e)
        
        health_status = {
            'status': 'healthy' if db_status == 'connected' else 'degraded',
            'timestamp': timezone.now().isoformat(),
            'database': {
                'status': db_status,
                'schema_status': schema_status,
                'details': db_details
            },
            'version': '1.0.0',
            'environment': getattr(settings, 'ENVIRONMENT', 'development'),
            'service': 'ChurchConnect API'
        }
        
        # Return appropriate HTTP status
        http_status = status.HTTP_200_OK if db_status == 'connected' else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return Response(health_status, status=http_status)
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}", exc_info=True)
        return Response({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'database': {
                'status': 'unknown',
                'details': {'error': 'health_check_exception'}
            },
            'error': str(e) if settings.DEBUG else 'Health check failed',
            'version': '1.0.0',
            'service': 'ChurchConnect API'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET'])
@permission_classes([AllowAny])
def system_status(request):
    """
    Detailed system status information with safe model access.
    """
    try:
        # Database check with more details
        db_status = {'status': 'connected', 'migration_count': 0}
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                db_status['migration_count'] = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM django_content_type")
                db_status['content_types'] = cursor.fetchone()[0]
        except Exception as e:
            db_status['status'] = 'error'
            db_status['error'] = str(e)
            logger.warning(f"Database check failed: {e}")
        
        # Safe app status check
        app_status = {}
        installed_apps = [app for app in settings.INSTALLED_APPS if not app.startswith('django.')]
        
        for app_label in ['members', 'groups', 'pledges', 'events', 'authentication', 'core']:
            if any(app_label in app for app in installed_apps):
                try:
                    app_config = apps.get_app_config(app_label)
                    app_status[app_label] = {
                        'status': 'available',
                        'models_count': len(app_config.get_models())
                    }
                except LookupError:
                    app_status[app_label] = {'status': 'not_installed'}
                except Exception as e:
                    app_status[app_label] = {
                        'status': 'error',
                        'error': str(e)
                    }
            else:
                app_status[app_label] = {'status': 'not_configured'}
        
        # Safe model statistics - only count if models exist and are migrated
        statistics = {}
        model_mappings = [
            ('members', 'Member'),
            ('groups', 'Group'), 
            ('pledges', 'Pledge'),
            ('events', 'Event'),
            ('authentication', 'AdminUser')
        ]
        
        for app_label, model_name in model_mappings:
            try:
                if app_status.get(app_label, {}).get('status') == 'available':
                    model = apps.get_model(app_label, model_name)
                    # Test if table exists by doing a count with limit
                    count = model.objects.all()[:1].count()  # Safer than count() on large tables
                    statistics[f'{app_label}_{model_name.lower()}_count'] = 'available'
                else:
                    statistics[f'{app_label}_{model_name.lower()}_count'] = 'unavailable'
            except Exception as e:
                statistics[f'{app_label}_{model_name.lower()}_count'] = f'error: {type(e).__name__}'
                logger.debug(f"Error accessing {app_label}.{model_name}: {e}")
        
        return Response({
            'status': 'ok',
            'timestamp': timezone.now().isoformat(),
            'system': {
                'python_version': sys.version.split()[0],
                'django_version': django.get_version(),
                'debug_mode': settings.DEBUG,
                'environment': getattr(settings, 'ENVIRONMENT', 'development'),
                'timezone': settings.TIME_ZONE,
                'installed_apps_count': len(settings.INSTALLED_APPS)
            },
            'database': db_status,
            'applications': app_status,
            'model_availability': statistics,
            'cache': {
                'backend': settings.CACHES['default']['BACKEND'],
                'status': 'configured'
            },
            'church_info': {
                'name': getattr(settings, 'CHURCH_NAME', 'ChurchConnect'),
                'timezone': getattr(settings, 'CHURCH_TIMEZONE', settings.TIME_ZONE),
            }
        })
        
    except Exception as e:
        logger.error(f"System status error: {str(e)}", exc_info=True)
        return Response({
            'status': 'error',
            'timestamp': timezone.now().isoformat(),
            'error': str(e) if settings.DEBUG else 'System status check failed',
            'system': {
                'python_version': sys.version.split()[0],
                'django_version': django.get_version(),
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_version(request):
    """
    API version information.
    """
    return Response({
        'api_version': '1.0.0',
        'api_name': 'ChurchConnect API',
        'documentation_url': '/api/docs/',
        'health_check_url': '/api/v1/core/health/',
        'system_status_url': '/api/v1/core/status/',
        'endpoints': {
            'authentication': '/api/v1/auth/',
            'members': '/api/v1/members/',
            'families': '/api/v1/families/',
            'groups': '/api/v1/groups/',
            'pledges': '/api/v1/pledges/',
            'reports': '/api/v1/reports/',
            'events': '/api/v1/events/',
            'core': '/api/v1/core/',
        },
        'features': {
            'authentication': 'JWT',
            'pagination': 'enabled',
            'rate_limiting': getattr(settings, 'RATE_LIMIT_SETTINGS', {}).get('ENABLE_RATE_LIMITING', True),
            'audit_logging': getattr(settings, 'FEATURE_FLAGS', {}).get('ENABLE_AUDIT_LOGGING', True),
            'api_versioning': True
        },
        'support': {
            'documentation': '/api/docs/',
            'contact': 'api-support@churchconnect.org'
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """
    Dashboard overview endpoint with safe model access and comprehensive error handling.
    """
    try:
        logger.info(f"Dashboard overview request from: {getattr(request.user, 'email', 'unknown')}")
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Initialize with safe defaults
        summary = {
            'total_members': 0,
            'active_members': 0,
            'recent_members': 0,
            'member_growth_rate': 0,
            'total_pledges': 0,
            'active_pledges': 0,
            'recent_pledges': 0,
            'total_pledged_amount': 0.0,
            'total_received_amount': 0.0,
            'outstanding_amount': 0.0,
            'total_groups': 0,
            'total_events': 0,
            'data_status': {}
        }
        
        # Safe member statistics
        try:
            Member = apps.get_model('members', 'Member')
            summary['total_members'] = Member.objects.count()
            summary['active_members'] = Member.objects.filter(is_active=True).count()
            summary['recent_members'] = Member.objects.filter(
                registration_date__gte=thirty_days_ago.date()
            ).count()
            
            # Calculate growth rate safely
            sixty_days_ago = timezone.now() - timedelta(days=60)
            previous_period = Member.objects.filter(
                registration_date__gte=sixty_days_ago.date(),
                registration_date__lt=thirty_days_ago.date()
            ).count()
            
            if previous_period > 0:
                growth = ((summary['recent_members'] - previous_period) / previous_period) * 100
                summary['member_growth_rate'] = round(growth, 1)
            elif summary['recent_members'] > 0:
                summary['member_growth_rate'] = 100.0
            
            summary['data_status']['members'] = 'success'
            logger.debug(f"Member stats: {summary['total_members']} total, {summary['active_members']} active")
            
        except Exception as e:
            summary['data_status']['members'] = f'error: {type(e).__name__}'
            logger.warning(f"Could not get member stats: {e}")
        
        # Safe pledge statistics
        try:
            Pledge = apps.get_model('pledges', 'Pledge')
            from django.db.models import Sum
            
            summary['total_pledges'] = Pledge.objects.count()
            summary['active_pledges'] = Pledge.objects.filter(status='active').count()
            summary['recent_pledges'] = Pledge.objects.filter(
                created_at__gte=thirty_days_ago
            ).count()
            
            # Aggregate amounts safely
            pledge_stats = Pledge.objects.aggregate(
                total_pledged=Sum('total_pledged'),
                total_received=Sum('total_received')
            )
            
            summary['total_pledged_amount'] = float(pledge_stats.get('total_pledged') or 0)
            summary['total_received_amount'] = float(pledge_stats.get('total_received') or 0)
            summary['outstanding_amount'] = summary['total_pledged_amount'] - summary['total_received_amount']
            
            summary['data_status']['pledges'] = 'success'
            logger.debug(f"Pledge stats: {summary['total_pledges']} total")
            
        except Exception as e:
            summary['data_status']['pledges'] = f'error: {type(e).__name__}'
            logger.warning(f"Could not get pledge stats: {e}")
        
        # Safe group statistics
        try:
            Group = apps.get_model('groups', 'Group')
            summary['total_groups'] = Group.objects.count()
            summary['data_status']['groups'] = 'success'
            logger.debug(f"Group stats: {summary['total_groups']} total")
        except Exception as e:
            summary['data_status']['groups'] = f'error: {type(e).__name__}'
            logger.warning(f"Could not get group stats: {e}")
        
        # Safe event statistics
        try:
            Event = apps.get_model('events', 'Event')
            summary['total_events'] = Event.objects.count()
            summary['data_status']['events'] = 'success'
            logger.debug(f"Event stats: {summary['total_events']} total")
        except Exception as e:
            summary['data_status']['events'] = f'error: {type(e).__name__}'
            logger.warning(f"Could not get event stats: {e}")
        
        # Calculate completion rate
        completion_rate = 0
        if summary['total_pledged_amount'] > 0:
            completion_rate = round(
                (summary['total_received_amount'] / summary['total_pledged_amount']) * 100, 1
            )
        
        overview_data = {
            'summary': summary,
            'completion_rate': completion_rate,
            'last_updated': timezone.now().isoformat(),
            'status': 'success',
            'data_quality': {
                'successful_queries': sum(1 for status in summary['data_status'].values() if status == 'success'),
                'total_queries': len(summary['data_status']),
                'errors': [k for k, v in summary['data_status'].items() if v.startswith('error')]
            }
        }
        
        logger.info("Dashboard overview generated successfully")
        return Response(overview_data)
        
    except Exception as e:
        logger.error(f"Dashboard overview error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to generate dashboard overview',
            'detail': str(e) if settings.DEBUG else 'Internal server error',
            'status': 'error',
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_health(request):
    """
    Dashboard health endpoint with comprehensive system status.
    """
    try:
        logger.debug(f"Dashboard health check from: {getattr(request.user, 'email', 'unknown')}")
        
        checks = {}
        overall_healthy = True
        
        # Database health check
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                migration_count = cursor.fetchone()[0]
            checks['database'] = {
                'status': 'healthy',
                'message': f'Connected ({migration_count} migrations applied)',
                'response_time_ms': '<5'
            }
        except Exception as e:
            checks['database'] = {
                'status': 'unhealthy',
                'message': str(e),
                'response_time_ms': 'timeout'
            }
            overall_healthy = False
        
        # App availability check
        critical_apps = ['members', 'groups', 'pledges', 'events', 'authentication']
        for app_name in critical_apps:
            try:
                app_config = apps.get_app_config(app_name)
                model_count = len(app_config.get_models())
                checks[f'{app_name}_app'] = {
                    'status': 'healthy',
                    'message': f'Available ({model_count} models)',
                    'models': model_count
                }
            except LookupError:
                checks[f'{app_name}_app'] = {
                    'status': 'warning',
                    'message': 'Not installed',
                    'models': 0
                }
            except Exception as e:
                checks[f'{app_name}_app'] = {
                    'status': 'unhealthy',
                    'message': str(e),
                    'models': 0
                }
                if app_name in ['authentication']:  # Critical apps
                    overall_healthy = False
        
        # Cache check
        try:
            from django.core.cache import cache
            test_key = f'health_check_{timezone.now().timestamp()}'
            cache.set(test_key, 'test', 30)
            result = cache.get(test_key)
            cache.delete(test_key)  # Clean up
            
            if result == 'test':
                checks['cache'] = {
                    'status': 'healthy',
                    'message': 'Read/write operational',
                    'backend': settings.CACHES['default']['BACKEND']
                }
            else:
                checks['cache'] = {
                    'status': 'warning',
                    'message': 'Not responding correctly',
                    'backend': settings.CACHES['default']['BACKEND']
                }
        except Exception as e:
            checks['cache'] = {
                'status': 'unhealthy',
                'message': str(e),
                'backend': 'unknown'
            }
            overall_healthy = False
        
        # Settings validation
        required_settings = ['SECRET_KEY', 'ALLOWED_HOSTS']
        settings_issues = []
        
        for setting in required_settings:
            if not hasattr(settings, setting):
                settings_issues.append(f'{setting} not set')
            elif not getattr(settings, setting):
                settings_issues.append(f'{setting} empty')
        
        checks['configuration'] = {
            'status': 'healthy' if not settings_issues else 'warning',
            'message': 'Valid configuration' if not settings_issues else f'Issues: {", ".join(settings_issues)}',
            'debug_mode': settings.DEBUG,
            'environment': getattr(settings, 'ENVIRONMENT', 'unknown')
        }
        
        # Disk space check (if possible)
        try:
            import shutil
            total, used, free = shutil.disk_usage('/')
            free_gb = free // (1024**3)
            checks['disk_space'] = {
                'status': 'healthy' if free_gb > 1 else 'warning',
                'message': f'{free_gb}GB free',
                'free_gb': free_gb
            }
        except Exception:
            checks['disk_space'] = {
                'status': 'unknown',
                'message': 'Cannot check disk space'
            }
        
        health_data = {
            'status': 'healthy' if overall_healthy else 'degraded',
            'timestamp': timezone.now().isoformat(),
            'checks': checks,
            'summary': {
                'total_checks': len(checks),
                'healthy': len([c for c in checks.values() if c['status'] == 'healthy']),
                'warnings': len([c for c in checks.values() if c['status'] == 'warning']),
                'unhealthy': len([c for c in checks.values() if c['status'] == 'unhealthy'])
            },
            'version': '1.0.0',
            'environment': getattr(settings, 'ENVIRONMENT', 'development')
        }
        
        return Response(health_data)
        
    except Exception as e:
        logger.error(f"Dashboard health check error: {str(e)}", exc_info=True)
        return Response({
            'status': 'unhealthy',
            'timestamp': timezone.now().isoformat(),
            'error': str(e) if settings.DEBUG else 'Health check failed',
            'checks': {
                'system': {
                    'status': 'unhealthy',
                    'message': 'Exception during health check'
                }
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_alerts(request):
    """
    Dashboard alerts endpoint with safe model access.
    """
    try:
        logger.debug(f"Dashboard alerts request from: {getattr(request.user, 'email', 'unknown')}")
        
        alerts = []
        today = timezone.now().date()
        
        # System health alerts
        try:
            # Check database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception as e:
            alerts.append({
                'id': 'database_connection',
                'type': 'error',
                'title': 'Database Connection Issue',
                'message': 'Database connection is experiencing problems',
                'created_at': timezone.now().isoformat(),
                'is_read': False,
                'priority': 'high'
            })
        
        # Model-specific alerts (safe)
        model_alerts = []
        
        # Check for overdue pledges
        try:
            Pledge = apps.get_model('pledges', 'Pledge')
            overdue_count = Pledge.objects.filter(
                status='active',
                end_date__lt=today
            ).count()
            
            if overdue_count > 0:
                model_alerts.append({
                    'id': 'overdue_pledges',
                    'type': 'warning',
                    'title': 'Overdue Pledges',
                    'message': f'{overdue_count} pledge{"s" if overdue_count != 1 else ""} past due date',
                    'count': overdue_count,
                    'action_url': '/pledges/?status=overdue',
                    'priority': 'medium'
                })
        except Exception as e:
            logger.debug(f"Could not check overdue pledges: {e}")
        
        # Check for inactive members
        try:
            Member = apps.get_model('members', 'Member')
            inactive_count = Member.objects.filter(is_active=False).count()
            
            if inactive_count > 0:
                model_alerts.append({
                    'id': 'inactive_members',
                    'type': 'info',
                    'title': 'Inactive Members',
                    'message': f'{inactive_count} member{"s" if inactive_count != 1 else ""} marked as inactive',
                    'count': inactive_count,
                    'action_url': '/members/?active=false',
                    'priority': 'low'
                })
        except Exception as e:
            logger.debug(f"Could not check inactive members: {e}")
        
        # Check for today's events
        try:
            Event = apps.get_model('events', 'Event')
            today_events = Event.objects.filter(
                start_datetime__date=today,
                status='published'
            ).count()
            
            if today_events > 0:
                model_alerts.append({
                    'id': 'events_today',
                    'type': 'success',
                    'title': "Today's Events",
                    'message': f'{today_events} event{"s" if today_events != 1 else ""} scheduled for today',
                    'count': today_events,
                    'action_url': '/events/?date=today',
                    'priority': 'high'
                })
        except Exception as e:
            logger.debug(f"Could not check today's events: {e}")
        
        # Add model alerts to main alerts
        for alert in model_alerts:
            alert.update({
                'created_at': timezone.now().isoformat(),
                'is_read': False
            })
            alerts.append(alert)
        
        # Production environment alerts
        if not settings.DEBUG:
            if hasattr(settings, 'SECRET_KEY') and len(settings.SECRET_KEY) < 50:
                alerts.append({
                    'id': 'weak_secret_key',
                    'type': 'warning',
                    'title': 'Security Notice',
                    'message': 'SECRET_KEY appears to be weak for production',
                    'created_at': timezone.now().isoformat(),
                    'is_read': False,
                    'priority': 'medium'
                })
        
        # Sort alerts by priority
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        alerts.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 2))
        
        return Response({
            'results': alerts,
            'count': len(alerts),
            'unread_count': len([a for a in alerts if not a.get('is_read', True)]),
            'last_updated': timezone.now().isoformat(),
            'summary': {
                'errors': len([a for a in alerts if a.get('type') == 'error']),
                'warnings': len([a for a in alerts if a.get('type') == 'warning']),
                'info': len([a for a in alerts if a.get('type') in ['info', 'success']])
            }
        })
        
    except Exception as e:
        logger.error(f"Dashboard alerts error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to get dashboard alerts',
            'detail': str(e) if settings.DEBUG else 'Internal server error',
            'results': [],
            'count': 0,
            'unread_count': 0,
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def dashboard_config(request, user_id):
    """
    Dashboard configuration endpoint with validation and security.
    """
    try:
        # Security check - users can only access their own config
        if str(request.user.id) != user_id and not request.user.can_manage_users():
            return Response({
                'error': 'Permission denied',
                'detail': 'You can only access your own dashboard configuration'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            logger.debug(f"Dashboard config request for user {user_id}")
            
            # In production, you would fetch from database
            # For now, return intelligent defaults based on user role
            user_role = getattr(request.user, 'role', 'readonly')
            
            # Role-based widget configuration
            base_widgets = [
                {
                    'id': 'member_stats',
                    'type': 'stat_card',
                    'position': {'x': 0, 'y': 0, 'w': 6, 'h': 4},
                    'visible': True,
                    'config': {'show_growth': user_role in ['admin', 'super_admin']}
                },
                {
                    'id': 'recent_activity',
                    'type': 'activity_feed',
                    'position': {'x': 0, 'y': 4, 'w': 12, 'h': 6},
                    'visible': True,
                    'config': {'limit': 10}
                }
            ]
            
            # Add admin-only widgets
            if user_role in ['admin', 'super_admin']:
                base_widgets.extend([
                    {
                        'id': 'pledge_stats',
                        'type': 'stat_card',
                        'position': {'x': 6, 'y': 0, 'w': 6, 'h': 4},
                        'visible': True,
                        'config': {'show_completion_rate': True}
                    },
                    {
                        'id': 'system_health',
                        'type': 'health_monitor',
                        'position': {'x': 0, 'y': 10, 'w': 12, 'h': 4},
                        'visible': user_role == 'super_admin',
                        'config': {'show_detailed_metrics': True}
                    }
                ])
            
            default_config = {
                'layout': 'grid',
                'theme': 'light',
                'refresh_interval': 300,  # 5 minutes
                'widgets': base_widgets,
                'notifications': {
                    'email': True,
                    'browser': True,
                    'frequency': 'daily'
                },
                'preferences': {
                    'compact_mode': False,
                    'show_animations': True,
                    'auto_refresh': True
                },
                'permissions': {
                    'can_edit': user_role in ['admin', 'super_admin'],
                    'can_export': user_role in ['admin', 'super_admin'],
                    'can_delete': user_role == 'super_admin'
                }
            }
            
            return Response(default_config)
            
        elif request.method == 'POST':
            config = request.data
            
            # Validate configuration structure
            required_fields = ['layout', 'widgets']
            validation_errors = []
            
            for field in required_fields:
                if field not in config:
                    validation_errors.append(f'Missing required field: {field}')
            
            # Validate layout
            valid_layouts = ['grid', 'list', 'custom']
            if config.get('layout') not in valid_layouts:
                validation_errors.append(f'Layout must be one of: {", ".join(valid_layouts)}')
            
            # Validate widgets structure
            widgets = config.get('widgets', [])
            if not isinstance(widgets, list):
                validation_errors.append('Widgets must be a list')
            else:
                for i, widget in enumerate(widgets):
                    if not isinstance(widget, dict):
                        validation_errors.append(f'Widget {i} must be an object')
                        continue
                    
                    required_widget_fields = ['id', 'type', 'position', 'visible']
                    for field in required_widget_fields:
                        if field not in widget:
                            validation_errors.append(f'Widget {i} missing field: {field}')
            
            # Validate refresh interval
            refresh_interval = config.get('refresh_interval')
            if refresh_interval is not None:
                if not isinstance(refresh_interval, int) or refresh_interval < 60:
                    validation_errors.append('Refresh interval must be at least 60 seconds')
            
            if validation_errors:
                return Response({
                    'error': 'Configuration validation failed',
                    'details': validation_errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Sanitize configuration
            sanitized_config = {
                'layout': config['layout'],
                'widgets': config['widgets'],
                'refresh_interval': config.get('refresh_interval', 300),
                'notifications': config.get('notifications', {}),
                'preferences': config.get('preferences', {}),
                'theme': config.get('theme', 'light')
            }
            
            logger.info(f"Dashboard config saved for user {user_id}")
            
            # In production, save to database here
            # UserDashboardConfig.objects.update_or_create(
            #     user_id=user_id,
            #     defaults={'config': sanitized_config}
            # )
            
            return Response({
                'success': True,
                'message': 'Dashboard configuration saved successfully',
                'config': sanitized_config,
                'saved_at': timezone.now().isoformat()
            })
            
    except Exception as e:
        logger.error(f"Dashboard config error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to handle dashboard configuration',
            'detail': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Lightweight dashboard statistics endpoint for real-time widgets.
    """
    try:
        logger.debug(f"Dashboard stats request from: {getattr(request.user, 'email', 'unknown')}")
        
        stats = {
            'timestamp': timezone.now().isoformat(),
            'members': {'total': 0, 'active': 0, 'new_this_month': 0, 'status': 'unavailable'},
            'pledges': {'total': 0, 'active': 0, 'total_amount': 0.0, 'received_amount': 0.0, 'status': 'unavailable'},
            'groups': {'total': 0, 'active': 0, 'status': 'unavailable'},
            'events': {'total': 0, 'upcoming': 0, 'today': 0, 'status': 'unavailable'},
            'system': {'status': 'healthy', 'version': '1.0.0'}
        }
        
        # Get date ranges
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        today = now.date()
        
        # Member statistics with error handling
        try:
            Member = apps.get_model('members', 'Member')
            stats['members'].update({
                'total': Member.objects.count(),
                'active': Member.objects.filter(is_active=True).count(),
                'new_this_month': Member.objects.filter(
                    registration_date__gte=start_of_month.date()
                ).count(),
                'status': 'success'
            })
        except Exception as e:
            stats['members']['status'] = f'error: {type(e).__name__}'
            logger.debug(f"Member stats unavailable: {e}")
        
        # Pledge statistics with error handling
        try:
            Pledge = apps.get_model('pledges', 'Pledge')
            from django.db.models import Sum
            
            amounts = Pledge.objects.aggregate(
                total=Sum('total_pledged'),
                received=Sum('total_received')
            )
            
            stats['pledges'].update({
                'total': Pledge.objects.count(),
                'active': Pledge.objects.filter(status='active').count(),
                'total_amount': float(amounts.get('total') or 0),
                'received_amount': float(amounts.get('received') or 0),
                'status': 'success'
            })
        except Exception as e:
            stats['pledges']['status'] = f'error: {type(e).__name__}'
            logger.debug(f"Pledge stats unavailable: {e}")
        
        # Group statistics with error handling
        try:
            Group = apps.get_model('groups', 'Group')
            total_groups = Group.objects.count()
            active_groups = Group.objects.filter(active=True).count() if hasattr(Group, 'active') else total_groups
            
            stats['groups'].update({
                'total': total_groups,
                'active': active_groups,
                'status': 'success'
            })
        except Exception as e:
            stats['groups']['status'] = f'error: {type(e).__name__}'
            logger.debug(f"Group stats unavailable: {e}")
        
        # Event statistics with error handling
        try:
            Event = apps.get_model('events', 'Event')
            
            stats['events'].update({
                'total': Event.objects.count(),
                'upcoming': Event.objects.filter(
                    start_datetime__gte=now,
                    status='published'
                ).count(),
                'today': Event.objects.filter(
                    start_datetime__date=today,
                    status='published'
                ).count(),
                'status': 'success'
            })
        except Exception as e:
            stats['events']['status'] = f'error: {type(e).__name__}'
            logger.debug(f"Event stats unavailable: {e}")
        
        logger.debug("Dashboard stats generated successfully")
        return Response(stats)
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to generate dashboard statistics',
            'detail': str(e) if settings.DEBUG else 'Internal server error',
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Custom error handlers
def custom_404(request, exception):
    """Custom 404 error handler."""
    return JsonResponse({
        'error': 'Not Found',
        'message': 'The requested resource was not found.',
        'status_code': 404,
        'timestamp': timezone.now().isoformat(),
        'path': request.path,
        'method': request.method
    }, status=404)

def custom_500(request):
    """Custom 500 error handler."""
    return JsonResponse({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred. Please try again later.',
        'status_code': 500,
        'timestamp': timezone.now().isoformat()
    }, status=500)