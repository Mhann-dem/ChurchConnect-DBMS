# ================================================================

# File: backend/core/management/commands/setup_church.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import AdminUser
from groups.models import Group

class Command(BaseCommand):
    help = 'Set up initial church data and admin user'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-email',
            type=str,
            default='admin@church.local',
            help='Email for the admin user',
        )
        parser.add_argument(
            '--admin-password',
            type=str,
            default='changeme123',
            help='Password for the admin user',
        )
        parser.add_argument(
            '--church-name',
            type=str,
            default='Sample Church',
            help='Name of the church',
        )
    
    def handle(self, *args, **options):
        self.stdout.write('Setting up initial church data...')
        
        # Create superuser if not exists
        admin_email = options['admin_email']
        admin_password = options['admin_password']
        church_name = options['church_name']
        
        if not AdminUser.objects.filter(email=admin_email).exists():
            admin_user = AdminUser.objects.create_superuser(
                username='admin',
                email=admin_email,
                password=admin_password,
                first_name='Church',
                last_name='Administrator',
                role='super_admin'
            )
            self.stdout.write(f'Created admin user: {admin_email}/{admin_password}')
        else:
            self.stdout.write('Admin user already exists')
        
        # Create default groups
        default_groups = [
            {
                'name': 'Youth Ministry',
                'description': 'Youth and young adults ministry focusing on spiritual growth and community building'
            },
            {
                'name': 'Worship Team',
                'description': 'Music and worship ministry leading Sunday services and special events'
            },
            {
                'name': 'Children\'s Ministry',
                'description': 'Children\'s programs, Sunday school, and family-oriented activities'
            },
            {
                'name': 'Seniors Ministry',
                'description': 'Programs and fellowship opportunities for senior adults'
            },
            {
                'name': 'Small Groups',
                'description': 'Bible study groups and fellowship circles for deeper community connection'
            },
            {
                'name': 'Outreach & Missions',
                'description': 'Community outreach programs and mission work'
            },
            {
                'name': 'Prayer Ministry',
                'description': 'Intercessory prayer groups and prayer support'
            },
        ]
        
        created_count = 0
        for group_data in default_groups:
            group, created = Group.objects.get_or_create(
                name=group_data['name'],
                defaults={
                    'description': group_data['description'],
                    'active': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'Created group: {group.name}')
        
        if created_count == 0:
            self.stdout.write('All default groups already exist')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully set up {church_name} with {created_count} new groups')
        )