"""
Management command to create a superuser with enhanced options
Usage: python manage.py create_admin
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
import getpass
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a superuser with role-based setup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address for the superuser',
        )
        parser.add_argument(
            '--username',
            type=str,
            help='Username for the superuser',
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the superuser (not recommended - will be prompted if not provided)',
        )
        parser.add_argument(
            '--interactive',
            action='store_true',
            default=True,
            help='Prompt for input (default)',
        )
        parser.add_argument(
            '--non-interactive',
            action='store_true',
            help='Non-interactive mode (requires all arguments)',
        )

    def handle(self, *args, **options):
        interactive = not options['non_interactive']
        
        # Get email
        if options['email']:
            email = options['email']
        elif interactive:
            email = input('Email address: ').strip()
        else:
            raise CommandError('Email is required')

        # Validate email
        if not email:
            raise CommandError('Email cannot be empty')

        if User.objects.filter(email=email).exists():
            raise CommandError(f'User with email {email} already exists')

        # Get username
        if options['username']:
            username = options['username']
        elif interactive:
            username = input('Username (optional, will use email prefix if not provided): ').strip()
            if not username:
                username = email.split('@')[0]
        else:
            username = email.split('@')[0]

        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            if counter > 100:
                raise CommandError('Could not generate unique username')

        # Get password
        if options['password']:
            password = options['password']
        elif interactive:
            while True:
                password = getpass.getpass('Password: ')
                password_confirm = getpass.getpass('Confirm password: ')
                if password == password_confirm:
                    break
                else:
                    self.stdout.write(self.style.ERROR('Passwords do not match'))
        else:
            raise CommandError('Password is required in non-interactive mode')

        if not password:
            raise CommandError('Password cannot be empty')

        if len(password) < 8:
            raise CommandError('Password must be at least 8 characters')

        # Create superuser
        try:
            user = User.objects.create_superuser(
                email=email,
                username=username,
                password=password,
                role='super_admin',
                active=True,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ Superuser created successfully!\n'
                    f'  Email: {email}\n'
                    f'  Username: {username}\n'
                    f'  Role: Super Administrator\n'
                    f'\nYou can now login with these credentials.'
                )
            )

            # Display next steps
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n📋 Next Steps:\n'
                    f'  1. Go to admin panel: /admin/\n'
                    f'  2. Go to login page: /auth/login/\n'
                    f'  3. Create additional admin users through the admin panel\n'
                )
            )

        except Exception as e:
            raise CommandError(f'Error creating superuser: {str(e)}')
