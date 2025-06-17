# backend/churchconnect/families/apps.py

from django.apps import AppConfig


class FamiliesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'families'
    verbose_name = 'Family Management'

    def ready(self):
        import families.signals