#!/usr/bin/env python
"""
Railway.app configuration for ChurchConnect Django backend
Place this file in the root of your backend directory
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'churchconnect.settings')

# Configure Django
import django
django.setup()

# Import WSGI application
from churchconnect.wsgi import application

# Ensure Railway PORT is used
PORT = int(os.getenv('PORT', 8000))

if __name__ == '__main__':
    # This is for local testing with Railway CLI
    import subprocess
    subprocess.run([
        'gunicorn',
        'churchconnect.wsgi',
        f'--bind=0.0.0.0:{PORT}',
        '--workers=3',
        '--timeout=60',
        '--access-logfile=-',
        '--error-logfile=-',
    ])
