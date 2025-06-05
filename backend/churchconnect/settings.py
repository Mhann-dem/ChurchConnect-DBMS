# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_yasg',
    'members',
    'families',
    'groups',
    'pledges',
    'authentication',
    'reports',
    'core',
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
}

# CORS settings (adjust for production)
CORS_ALLOW_ALL_ORIGINS = True  # For development only

# Simple JWT settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Custom user model
AUTH_USER_MODEL = 'authentication.User'

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# ALLOWED_HOSTS = ['localhost', '127.0.0.1']  # for development
# or for production:
# ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']