# ================================================================

# File: backend/churchconnect/asgi.py
"""
ASGI config for ChurchConnect project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'churchconnect.settings')

# Initialize Django ASGI application early to ensure the AppRegistry is populated
django_asgi_app = get_asgi_application()

# Import websocket routing after Django is initialized
try:
    from core.routing import websocket_urlpatterns
except ImportError:
    websocket_urlpatterns = []

# ASGI application configuration
application = ProtocolTypeRouter({
    # Handle HTTP requests
    "http": django_asgi_app,
    
    # Handle WebSocket connections (for real-time features)
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
