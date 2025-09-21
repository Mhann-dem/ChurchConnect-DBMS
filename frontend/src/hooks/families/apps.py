# backend/churchconnect/families/apps.py

from django.apps import AppConfig


class FamiliesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'families'
    verbose_name = 'Family Management'

    def ready(self):
        # Only import signals if you decide to use them
        # For now, we're handling the logic in models and views
        # import families.signals
        pass