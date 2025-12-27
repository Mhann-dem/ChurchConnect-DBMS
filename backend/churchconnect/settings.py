# backend/churchconnect/settings.py - TIMEZONE FIXES APPLIED
import os
from pathlib import Path
from datetime import timedelta
from decouple import Config, RepositoryEnv, AutoConfig

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Point to the .env file in the parent directory (backend folder)
ENV_PATH = BASE_DIR / '.env'
# config = Config(RepositoryEnv(ENV_PATH))
# ✅ Use .env if it exists (local), otherwise use environment variables (Railway)
config = AutoConfig(search_path=str(BASE_DIR))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')
if not SECRET_KEY or SECRET_KEY == 'django-insecure-change-this-in-production':
    raise ValueError("SECRET_KEY must be set in production")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default='False', cast=bool)

# Production security check
if not DEBUG and SECRET_KEY == 'django-insecure-change-this-in-production':
    raise ValueError("Cannot use default SECRET_KEY in production")

# SECURITY: Strict allowed hosts in production
if DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']
else:
    ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')
    if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
        raise ValueError("ALLOWED_HOSTS must be configured in production")

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework_simplejwt.token_blacklist',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',  # Added for API documentation
    'phonenumber_field',
]

LOCAL_APPS = [
    'core',
    'authentication',
    'members',
    'families',
    'groups',
    'pledges',
    'reports',
    'events',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# SECURITY: Only add debug tools in development
if DEBUG:
    try:
        import django_extensions
        INSTALLED_APPS.append('django_extensions')
    except ImportError:
        pass

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'churchconnect.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'churchconnect.wsgi.application'

# Database configuration with security checks
if config('DB_NAME', default=None):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'OPTIONS': {
                'sslmode': 'require' if not DEBUG else 'prefer',
            }
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'authentication.AdminUser'

# SECURITY: Strong password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# FIXED: Internationalization with proper timezone handling
LANGUAGE_CODE = 'en-us'
TIME_ZONE = config('TIME_ZONE', default='UTC')
USE_I18N = True
USE_TZ = True  # This ensures Django uses timezone-aware datetime objects

# FIXED: Add timezone settings to prevent warnings
import zoneinfo
try:
    # Validate the timezone
    zoneinfo.ZoneInfo(TIME_ZONE)
except Exception:
    # Fallback to UTC if invalid timezone
    TIME_ZONE = 'UTC'
    
# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# SECURITY: File upload limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
FILE_UPLOAD_PERMISSIONS = 0o644

# SECURITY: CORS settings - restrictive by default
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "https://churchconnect-dbms-production.up.railway.app"
        "https://thorough-adventure-production.up.railway.app"
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:3000",
    ]
    CORS_ALLOW_ALL_ORIGINS = False  # Even in debug, be explicit
else:
    # Production: Only allow specific origins
    CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')
    if not CORS_ALLOWED_ORIGINS or CORS_ALLOWED_ORIGINS == ['']:
        raise ValueError("CORS_ALLOWED_ORIGINS must be configured in production")

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# SECURITY: Production HTTPS settings
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Additional security headers
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# SECURITY: REST Framework with strict permissions
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # Secure by default
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        # Remove BrowsableAPIRenderer in production
    ] if not DEBUG else [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    
    # SECURITY: Strict rate limiting
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/hour' if not DEBUG else '100/hour',
        'user': '100/hour' if not DEBUG else '1000/hour'
    },
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',      # Increased from default
        'user': '1000/hour',     # Increased from default  
        'family_ops': '100/min', # Custom rate for family operations
    },
    
    # API Documentation
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'ChurchConnect API',
    'DESCRIPTION': 'ChurchConnect Church Management System API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # Removed ENUM_NAME_OVERRIDES to let drf-spectacular auto-generate enum names
    # This eliminates the duplication error and warnings
}

# SECURITY: JWT Configuration with strong settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15 if not DEBUG else 60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1 if not DEBUG else 7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# SECURITY: Secure session settings
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_COOKIE_AGE = 3600  # 1 hour
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_SAVE_EVERY_REQUEST = True

if not DEBUG:
    SESSION_COOKIE_SECURE = True

# SECURITY: Secure logging - don't log sensitive data
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'churchconnect.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'churchconnect': {
            'handlers': ['file', 'console'] if DEBUG else ['file', 'mail_admins'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'authentication': {
            'handlers': ['file', 'console'] if DEBUG else ['file'],
            'level': 'INFO',
            'propagate': False,
        },
        'pledges': {
            'handlers': ['file', 'console'] if DEBUG else ['file'],
            'level': 'INFO',
            'propagate': False,
        },
        'groups': {
            'handlers': ['file', 'console'] if DEBUG else ['file'],
            'level': 'INFO',
            'propagate': False,
        },
        'members': {
            'handlers': ['file', 'console'] if DEBUG else ['file'],
            'level': 'INFO',
            'propagate': False,
        },
        # SECURITY: Don't log sensitive auth tokens
        'rest_framework_simplejwt': {
            'handlers': ['file'],
            'level': 'ERROR',  # Only log errors, not tokens
            'propagate': False,
        },
    },
}

# Create logs directory
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Email configuration
EMAIL_BACKEND = config(
    'EMAIL_BACKEND', 
    default='django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend'
)

if not DEBUG:
    EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@church.com')

# FIXED: Cache configuration - removed conflicting options
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/2'),
        'TIMEOUT': 300,
    } if config('REDIS_URL', default=None) else {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,
        'OPTIONS': {
            'MAX_ENTRIES': 1000,  # This is fine for LocMemCache
        },
    }
}

# Church-specific settings
CHURCH_NAME = config('CHURCH_NAME', default='Your Church Name')
CHURCH_EMAIL = config('CHURCH_EMAIL', default='')
CHURCH_PHONE = config('CHURCH_PHONE', default='')
CHURCH_ADDRESS = config('CHURCH_ADDRESS', default='')

# Default auto field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# SECURITY: Admin configuration
if not DEBUG:
    ADMINS = [
        ('Admin', config('ADMIN_EMAIL', default='')),
    ]
    MANAGERS = ADMINS

# SECURITY: Disable debug toolbar in production
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS.append('debug_toolbar')
        MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1']
    except ImportError:
        pass