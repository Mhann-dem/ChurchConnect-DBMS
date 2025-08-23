# ==============================================================================
# pledges/apps.py
# ==============================================================================
from django.apps import AppConfig


class PledgesConfig(AppConfig):
    """Configuration for the pledges app"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pledges'
    verbose_name = 'Pledges & Donations'
    
    def ready(self):
        """Initialize app when Django starts"""
        # Import signals to ensure they are connected
        try:
            from . import signals
        except ImportError:
            # Signals file doesn't exist yet - that's OK
            pass
        
        # Register any app-specific checks
        from django.core.checks import register
        # You could add custom system checks here if needed
        
        # Import and register custom permissions if needed
        try:
            from . import permissions
        except ImportError:
            pass