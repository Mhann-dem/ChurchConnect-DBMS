# ================================================================

# File: backend/core/routing.py
from django.urls import re_path
from . import consumers

# WebSocket URL patterns for real-time features
websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<user_id>\w+)/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/dashboard/(?P<room_name>\w+)/$', consumers.DashboardConsumer.as_asgi()),
]
