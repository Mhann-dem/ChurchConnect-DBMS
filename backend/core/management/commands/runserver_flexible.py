# Create this file at: backend/core/management/commands/runserver_flexible.py

import os
import sys
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.core.management import execute_from_command_line

class Command(BaseCommand):
    help = 'Starts a lightweight Web server for development with optional HTTPS support.'

    def add_arguments(self, parser):
        parser.add_argument(
            'addrport', nargs='?', default='127.0.0.1:8000',
            help='Optional port number, or ipaddr:port'
        )
        parser.add_argument(
            '--https',
            action='store_true',
            help='Enable HTTPS using self-signed certificates',
        )
        parser.add_argument(
            '--cert-file',
            help='Path to SSL certificate file',
        )
        parser.add_argument(
            '--key-file',
            help='Path to SSL private key file',
        )

    def handle(self, *args, **options):
        # Check if HTTPS is requested
        if options.get('https') or options.get('cert_file') or options.get('key_file'):
            return self.run_https_server(options)
        else:
            return self.run_http_server(options)

    def run_https_server(self, options):
        """Run HTTPS server using django-extensions or manual SSL setup"""
        # Validate certificate files
        cert_file = options.get('cert_file') or os.path.join('ssl', 'cert.pem')
        key_file = options.get('key_file') or os.path.join('ssl', 'key.pem')
        
        if not os.path.exists(cert_file):
            raise CommandError(f'Certificate file not found: {cert_file}')
        if not os.path.exists(key_file):
            raise CommandError(f'Private key file not found: {key_file}')
        
        self.stdout.write(self.style.SUCCESS('Starting HTTPS server with:'))
        self.stdout.write(f'Certificate: {cert_file}')
        self.stdout.write(f'Private Key: {key_file}')
        
        # Try to use django-extensions runserver_plus
        try:
            # Check if django-extensions is available
            import django_extensions
            
            # Construct command for runserver_plus
            addrport = options.get('addrport', '127.0.0.1:8000')
            cmd = [
                'manage.py',
                'runserver_plus',
                addrport,
                '--cert-file', cert_file,
                '--key-file', key_file
            ]
            
            self.stdout.write(f'Running: python {" ".join(cmd[1:])}')
            execute_from_command_line(cmd)
            
        except ImportError:
            raise CommandError(
                'django-extensions is required for HTTPS support.\n'
                'Install it with: pip install django-extensions\n'
                'Or use the regular runserver for HTTP: python manage.py runserver'
            )
        except Exception as e:
            raise CommandError(f'Failed to start HTTPS server: {e}')

    def run_http_server(self, options):
        """Run regular HTTP server"""
        self.stdout.write(self.style.SUCCESS('Starting HTTP server...'))
        
        # Use Django's built-in runserver
        addrport = options.get('addrport', '127.0.0.1:8000')
        cmd = ['manage.py', 'runserver', addrport]
        
        try:
            execute_from_command_line(cmd)
        except Exception as e:
            raise CommandError(f'Failed to start HTTP server: {e}')