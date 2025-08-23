# backend/churchconnect/groups/apps.py

from django.apps import AppConfig


class GroupsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'groups'
    verbose_name = 'Groups and Ministries'

    def ready(self):
        """Import signal handlers when app is ready"""
        try:
            import groups.signals  # noqa
        except ImportError:
            pass
