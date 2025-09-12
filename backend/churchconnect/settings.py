# File: backend/churchconnect/settings.py
"""
Enhanced Django settings for ChurchConnect DBMS
Production-ready configuration with comprehensive security, monitoring, and optimization
"""

import os
import sys
from pathlib import Path
from datetime import timedelta
from decouple import Config, RepositoryEnv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment configuration with fallback
ENV_PATH = BASE_DIR / '.env'
if ENV_PATH.exists():
    config = Config(RepositoryEnv(ENV_PATH))
else:
    config = Config()

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='')
if not SECRET_KEY:
    if config('DEBUG', default='False', cast=bool):
        SECRET_KEY = 'django-insecure-dev-key-change-in-production'
    else:
        raise ValueError("SECRET_KEY must be set in production environment")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default='False', cast=bool)

# Environment detection
ENVIRONMENT = config('ENVIRONMENT', default='development')
IS_PRODUCTION = ENVIRONMENT == 'production'
IS_STAGING = ENVIRONMENT == 'staging'
IS_DEVELOPMENT = ENVIRONMENT == 'development' or DEBUG

# Production security checks
if IS_PRODUCTION:
    if SECRET_KEY == 'django-insecure-dev-key-change-in-production':
        raise ValueError("Cannot use default SECRET_KEY in production")
    if DEBUG:
        raise ValueError("DEBUG cannot be True in production")

# Host configuration
if DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]']
else:
    ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')
    if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
        raise ValueError("ALLOWED_HOSTS must be configured in production")

# Additional allowed hosts from environment
ADDITIONAL_HOSTS = config('ADDITIONAL_HOSTS', default='').split(',')
ALLOWED_HOSTS.extend([host.strip() for host in ADDITIONAL_HOSTS if host.strip()])

# Trusted origins for CSRF
CSRF_TRUSTED_ORIGINS = []
if not DEBUG:
    origins = config('CSRF_TRUSTED_ORIGINS', default='').split(',')
    CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in origins if origin.strip()]

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',  # For human-friendly numbers and dates
    'rest_framework_simplejwt.token_blacklist',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',  # API documentation
    'django_extensions',  # Development utilities
    'django_celery_beat',  # Scheduled tasks
    'django_celery_results',  # Task results
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
    # 'notifications',  # Email/SMS notifications
    # 'audit',  # Audit trail system
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# Development-only apps
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS.append('debug_toolbar')
    except ImportError:
        pass

# Middleware configuration with security enhancements
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Static file serving
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',  # Internationalization
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.SecurityHeadersMiddleware',  # Custom security headers
    'core.middleware.AuditMiddleware',  # Audit logging
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.RateLimitMiddleware',  # Rate limiting
]

# Add debug toolbar in development
if DEBUG and 'debug_toolbar' in INSTALLED_APPS:
    MIDDLEWARE.insert(1, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    INTERNAL_IPS = ['127.0.0.1', '::1']

ROOT_URLCONF = 'churchconnect.urls'

# Template configuration
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
                'core.context_processors.church_settings',  # Church-specific context
                'core.context_processors.security_context',  # Security context
            ],
        },
    },
]

WSGI_APPLICATION = 'churchconnect.wsgi.application'
ASGI_APPLICATION = 'churchconnect.asgi.application'

# Database configuration with connection pooling
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    # Replace the DATABASE_URL section with:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='churchconnect'),
            'USER': config('DB_USER', default='churchadmin'),
            'PASSWORD': config('DB_PASSWORD', default='1mhann.dem'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'OPTIONS': {
                'sslmode': 'require' if IS_PRODUCTION else 'prefer',
                'connect_timeout': 10,
                'application_name': 'churchconnect',
            },
            'CONN_MAX_AGE': 600,
            'TEST': {
                'NAME': 'test_churchconnect',
            }
        }
    }
    # Enhanced database options for production
    DATABASES['default'].update({
        'OPTIONS': {
            'sslmode': 'require' if IS_PRODUCTION else 'prefer',
            'connect_timeout': 10,
            'application_name': 'churchconnect',
        },
        'CONN_MAX_AGE': 600,
        'TEST': {
            'NAME': 'test_churchconnect',
        }
    })
else:
    # Fallback to SQLite for development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
            'OPTIONS': {
                'timeout': 20,
                'check_same_thread': False,
            }
        }
    }

# Database connection health checks
DATABASES['default']['CONN_HEALTH_CHECKS'] = True

# Custom User Model
AUTH_USER_MODEL = 'authentication.AdminUser'

# Enhanced password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        'OPTIONS': {
            'user_attributes': ['username', 'email', 'first_name', 'last_name'],
            'max_similarity': 0.7,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12 if IS_PRODUCTION else 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'core.validators.CustomPasswordValidator',  # Custom password rules
    },
]

# Internationalization
LANGUAGE_CODE = config('LANGUAGE_CODE', default='en-us')
TIME_ZONE = config('TIME_ZONE', default='UTC')
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Additional language support
LANGUAGES = [
    ('en', 'English'),
    ('es', 'Spanish'),
    ('fr', 'French'),
    ('pt', 'Portuguese'),
    ('de', 'German'),
]

LOCALE_PATHS = [BASE_DIR / 'locale']

# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Static file storage with compression
if IS_PRODUCTION:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
else:
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload security
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Allowed file types for uploads
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/csv', 'application/vnd.ms-excel']
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB

# CORS configuration
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:3000",
        "http://localhost:3001",  # Alternative dev port
        "http://localhost:8080",  # Vue.js default
    ]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    # Production: strict CORS policy
    origins = config('CORS_ALLOWED_ORIGINS', default='').split(',')
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in origins if origin.strip()]
    
    if not CORS_ALLOWED_ORIGINS:
        raise ValueError("CORS_ALLOWED_ORIGINS must be configured in production")

CORS_ALLOW_CREDENTIALS = True
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-timezone',
    'cache-control',
]

CORS_EXPOSE_HEADERS = [
    'content-disposition',
    'x-total-count',
    'x-pagination-page',
    'x-pagination-per-page',
]

# Enhanced security settings for production
if IS_PRODUCTION:
    # HTTPS Security
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Cookie Security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    CSRF_COOKIE_SAMESITE = 'Strict'
    
    # Additional security headers
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
    SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'
    X_FRAME_OPTIONS = 'DENY'
    
    # Content Security Policy
    CSP_DEFAULT_SRC = ("'self'",)
    CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
    CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
    CSP_IMG_SRC = ("'self'", "data:", "https:")
    CSP_CONNECT_SRC = ("'self'",)

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_COOKIE_AGE = config('SESSION_COOKIE_AGE', default=3600, cast=int)  # 1 hour
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Enhanced REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # For admin
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] + (['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),
    
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
    
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour' if DEBUG else '20/hour',
        'user': '2000/hour' if DEBUG else '500/hour',
        'login': '10/minute',
        'password_reset': '5/hour',
        'public_form': '10/hour',
    },
    
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    
    # API versioning
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.AcceptHeaderVersioning',
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1'],
    
    # Response formatting
    'DEFAULT_METADATA_CLASS': 'rest_framework.metadata.SimpleMetadata',
    'COMPACT_JSON': not DEBUG,
}

# JWT Configuration with enhanced security
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=15 if IS_PRODUCTION else 60, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=1 if IS_PRODUCTION else 7, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': 'churchconnect',
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# Cache configuration with Redis for production
REDIS_URL = config('REDIS_URL', default=None)

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': 50,
                    'retry_on_timeout': True,
                },
                'COMPRESSOR': 'django.core.cache.backends.redis.GzipCompressor',
            },
            'TIMEOUT': 300,  # 5 minutes
            'VERSION': 1,
        },
        'sessions': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'TIMEOUT': SESSION_COOKIE_AGE,
            'OPTIONS': {
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': 20,
                },
            },
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'churchconnect-cache',
            'TIMEOUT': 300,
            'OPTIONS': {
                'MAX_ENTRIES': 1000,
            },
        }
    }

# Session backend using cache
if REDIS_URL:
    SESSION_CACHE_ALIAS = 'sessions'

# Enhanced logging configuration
LOG_LEVEL = config('LOG_LEVEL', default='INFO' if IS_PRODUCTION else 'DEBUG')

# Ensure log directory exists
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
        'json': {
            '()': 'core.logging.JSONFormatter',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'sensitive_data_filter': {
            '()': 'core.logging.SensitiveDataFilter',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'filters': ['sensitive_data_filter'],
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file_general': {
            'level': 'INFO',
            'filters': ['require_debug_false', 'sensitive_data_filter'],
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'churchconnect.log',
            'maxBytes': 1024*1024*50,  # 50MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'file_security': {
            'level': 'INFO',
            'filters': ['sensitive_data_filter'],
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'security.log',
            'maxBytes': 1024*1024*25,  # 25MB
            'backupCount': 20,
            'formatter': 'json',
        },
        'file_api': {
            'level': 'INFO',
            'filters': ['sensitive_data_filter'],
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOG_DIR / 'api.log',
            'maxBytes': 1024*1024*25,  # 25MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'mail_admins': {
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'class': 'django.utils.log.AdminEmailHandler',
            'formatter': 'verbose',
            'include_html': True,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['file_general', 'console'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'django.security': {
            'handlers': ['file_security', 'mail_admins'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file_api', 'mail_admins'],
            'level': 'ERROR',
            'propagate': False,
        },
        'churchconnect': {
            'handlers': ['file_general', 'console'] + (['mail_admins'] if IS_PRODUCTION else []),
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'authentication': {
            'handlers': ['file_security', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'core.security': {
            'handlers': ['file_security'],
            'level': 'INFO',
            'propagate': False,
        },
        'rest_framework': {
            'handlers': ['file_api'],
            'level': 'INFO',
            'propagate': False,
        },
        # Silence noisy loggers in production
        'django.utils.autoreload': {
            'level': 'INFO' if DEBUG else 'WARNING',
        },
        'django.template': {
            'level': 'INFO' if DEBUG else 'WARNING',
        },
    },
}

# Email configuration with multiple backends
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')

if EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
    EMAIL_HOST = config('EMAIL_HOST')
    EMAIL_PORT = config('EMAIL_PORT', cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
    EMAIL_TIMEOUT = 30
    
    # Default email addresses
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@churchconnect.org')
    SERVER_EMAIL = config('SERVER_EMAIL', default=DEFAULT_FROM_EMAIL)
    SUPPORT_EMAIL = config('SUPPORT_EMAIL', default='support@churchconnect.org')

# Celery configuration for background tasks
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default=REDIS_URL or 'redis://localhost:6379/1')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default=REDIS_URL or 'redis://localhost:6379/1')

CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TASK_RESULT_EXPIRES = 3600  # 1 hour

# Task routing
CELERY_TASK_ROUTES = {
    'core.tasks.send_email': {'queue': 'email'},
    'core.tasks.generate_report': {'queue': 'reports'},
    'core.tasks.cleanup_old_data': {'queue': 'maintenance'},
    'authentication.tasks.cleanup_expired_tokens': {'queue': 'maintenance'},
}

# Beat schedule for periodic tasks
CELERY_BEAT_SCHEDULE = {
    'cleanup-expired-tokens': {
        'task': 'authentication.tasks.cleanup_expired_tokens',
        'schedule': timedelta(hours=1),
    },
    'cleanup-old-login-attempts': {
        'task': 'authentication.tasks.cleanup_old_login_attempts',
        'schedule': timedelta(days=1),
    },
    'security-report': {
        'task': 'core.tasks.generate_security_report',
        'schedule': timedelta(hours=24),
    },
    'database-backup': {
        'task': 'core.tasks.backup_database',
        'schedule': timedelta(hours=6),
        'options': {'queue': 'maintenance'}
    },
}

# API Documentation (Spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'ChurchConnect DBMS API',
    'DESCRIPTION': 'Comprehensive Church Data Management System API',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'CONTACT': {
        'name': 'ChurchConnect Support',
        'email': 'api-support@churchconnect.org',
    },
    'LICENSE': {
        'name': 'Proprietary',
    },
    'SERVERS': [
        {'url': 'http://localhost:8000', 'description': 'Development Server'},
        {'url': 'https://api.churchconnect.org', 'description': 'Production Server'},
    ],
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication and authorization'},
        {'name': 'Members', 'description': 'Church member management'},
        {'name': 'Groups', 'description': 'Ministry and group management'},
        {'name': 'Pledges', 'description': 'Financial pledge tracking'},
        {'name': 'Reports', 'description': 'Data export and reporting'},
    ],
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,
}

# Church-specific settings
CHURCH_NAME = config('CHURCH_NAME', default='Your Church Name')
CHURCH_EMAIL = config('CHURCH_EMAIL', default='')
CHURCH_PHONE = config('CHURCH_PHONE', default='')
CHURCH_ADDRESS = config('CHURCH_ADDRESS', default='')
CHURCH_WEBSITE = config('CHURCH_WEBSITE', default='')
CHURCH_TIMEZONE = config('CHURCH_TIMEZONE', default=TIME_ZONE)

# Frontend application URL
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# Admin configuration
ADMINS = [
    ('ChurchConnect Admin', config('ADMIN_EMAIL', default='admin@churchconnect.org')),
]
MANAGERS = ADMINS

# Default auto field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Data retention policies (in days)
DATA_RETENTION = {
    'login_attempts': config('RETENTION_LOGIN_ATTEMPTS', default=90, cast=int),
    'password_reset_tokens': config('RETENTION_PASSWORD_TOKENS', default=7, cast=int),
    'audit_logs': config('RETENTION_AUDIT_LOGS', default=365, cast=int),
    'user_sessions': config('RETENTION_USER_SESSIONS', default=30, cast=int),
    'export_files': config('RETENTION_EXPORT_FILES', default=7, cast=int),
}

# Rate limiting configuration
RATE_LIMIT_SETTINGS = {
    'ENABLE_RATE_LIMITING': config('ENABLE_RATE_LIMITING', default=True, cast=bool),
    'DEFAULT_RATE_LIMIT': config('DEFAULT_RATE_LIMIT', default='100/hour'),
    'LOGIN_RATE_LIMIT': config('LOGIN_RATE_LIMIT', default='10/minute'),
    'API_RATE_LIMIT': config('API_RATE_LIMIT', default='500/hour'),
    'PUBLIC_FORM_RATE_LIMIT': config('PUBLIC_FORM_RATE_LIMIT', default='10/hour'),
}

# Feature flags
FEATURE_FLAGS = {
    'ENABLE_TWO_FACTOR_AUTH': config('ENABLE_TWO_FACTOR_AUTH', default=False, cast=bool),
    'ENABLE_EMAIL_NOTIFICATIONS': config('ENABLE_EMAIL_NOTIFICATIONS', default=True, cast=bool),
    'ENABLE_SMS_NOTIFICATIONS': config('ENABLE_SMS_NOTIFICATIONS', default=False, cast=bool),
    'ENABLE_AUDIT_LOGGING': config('ENABLE_AUDIT_LOGGING', default=True, cast=bool),
    'ENABLE_DATA_EXPORT': config('ENABLE_DATA_EXPORT', default=True, cast=bool),
    'ENABLE_BULK_OPERATIONS': config('ENABLE_BULK_OPERATIONS', default=True, cast=bool),
    'ENABLE_API_VERSIONING': config('ENABLE_API_VERSIONING', default=True, cast=bool),
}

# Monitoring and health checks
HEALTH_CHECKS = {
    'DATABASE_TIMEOUT': config('HEALTH_DB_TIMEOUT', default=5, cast=int),
    'CACHE_TIMEOUT': config('HEALTH_CACHE_TIMEOUT', default=3, cast=int),
    'EMAIL_TIMEOUT': config('HEALTH_EMAIL_TIMEOUT', default=10, cast=int),
}

# Testing configuration
if 'test' in sys.argv:
    # Use faster password hasher for tests
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
    ]
    
    # Use in-memory database for tests
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
    
    # Disable migrations for faster tests
    class DisableMigrations:
        def __contains__(self, item):
            return True
        
        def __getitem__(self, item):
            return None
    
    MIGRATION_MODULES = DisableMigrations()
    
    # Simplified cache for tests
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# Development-specific settings
if DEBUG:
    # Django Extensions
    try:
        import django_extensions
        SHELL_PLUS = "ipython"
        SHELL_PLUS_POST_IMPORTS = [
            ('authentication.models', 'AdminUser', 'LoginAttempt'),
            ('members.models', 'Member'),
            ('django.utils', 'timezone'),
        ]
    except ImportError:
        pass
    
    # Additional development middleware
    if 'debug_toolbar' in INSTALLED_APPS:
        DEBUG_TOOLBAR_CONFIG = {
            'SHOW_TEMPLATE_CONTEXT': True,
            'SHOW_TOOLBAR_CALLBACK': lambda request: True,
        }

# Import local settings if they exist
try:
    from .local_settings import *
except ImportError:
    pass