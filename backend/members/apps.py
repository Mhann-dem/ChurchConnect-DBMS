# members/apps.py
from django.apps import AppConfig

class MembersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'members'
    verbose_name = 'Church Members'
    
    def ready(self):
        # Import signals if you have any
        try:
            import members.signals
        except ImportError:
            pass