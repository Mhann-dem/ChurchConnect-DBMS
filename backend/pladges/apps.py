# ==============================================================================
# pledges/apps.py
# ==============================================================================
from django.apps import AppConfig


class PledgesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pledges'
    verbose_name = 'Pledges'

    def ready(self):
        import pladges.signals

