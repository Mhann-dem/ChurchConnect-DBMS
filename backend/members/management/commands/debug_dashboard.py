# management/commands/debug_dashboard.py
# Place this file in: members/management/commands/debug_dashboard.py

from django.core.management.base import BaseCommand
from django.db import connection
from django.urls import reverse
from django.test.client import Client
from django.contrib.auth import get_user_model
import json
import sys
from members.models import Member
from groups.models import Group
from families.models import Family

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug dashboard data issues and API endpoints'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-data',
            action='store_true',
            help='Check database data integrity',
        )
        parser.add_argument(
            '--check-endpoints',
            action='store_true',
            help='Test API endpoints',
        )
        parser.add_argument(
            '--check-permissions',
            action='store_true',
            help='Check user permissions',
        )
        parser.add_argument(
            '--fix-data',
            action='store_true',
            help='Attempt to fix common data issues',
        )
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create test data for debugging',
        )
        parser.add_argument(
            '--user-email',
            type=str,
            help='Email of user to test with',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== ChurchConnect Dashboard Debug Tool ==='))
        
        # Check database connectivity
        self.check_database()
        
        if options['check_data']:
            self.check_data_integrity()
        
        if options['check_endpoints']:
            user_email = options.get('user_email')
            self.test_api_endpoints(user_email)
        
        if options['check_permissions']:
            user_email = options.get('user_email')
            self.check_user_permissions(user_email)
            
        if options['fix_data']:
            self.fix_common_issues()
            
        if options['create_test_data']:
            self.create_test_data()
        
        self.stdout.write(self.style.SUCCESS('\n=== Debug Complete ==='))

    def check_database(self):
        """Check database connectivity and basic health"""
        self.stdout.write('\n--- Database Health Check ---')
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                self.stdout.write(self.style.SUCCESS('✓ Database connection: OK'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Database connection failed: {e}'))
            return False
        
        # Check tables exist - use custom user model table instead of auth_user
        tables = [
            'members_member',
            'groups_group', 
            'families_family',
        ]
        
        # Add custom user table dynamically
        try:
            user_table = User._meta.db_table
            tables.append(user_table)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠ Could not determine user table name: {e}'))
        
        with connection.cursor() as cursor:
            for table in tables:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    self.stdout.write(self.style.SUCCESS(f'✓ Table {table}: {count} records'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ Table {table}: {e}'))
        
        return True

    def check_data_integrity(self):
        """Check data integrity and common issues"""
        self.stdout.write('\n--- Data Integrity Check ---')
        
        # Check Members
        total_members = Member.objects.count()
        active_members = Member.objects.filter(is_active=True).count()
        members_with_email = Member.objects.exclude(email__isnull=True).exclude(email='').count()
        
        self.stdout.write(f'Members:')
        self.stdout.write(f'  Total: {total_members}')
        self.stdout.write(f'  Active: {active_members}')
        self.stdout.write(f'  With Email: {members_with_email}')
        
        if total_members == 0:
            self.stdout.write(self.style.WARNING('⚠ No members in database - this explains the 0 count on dashboard'))
        
        # Check Groups
        total_groups = Group.objects.count()
        active_groups = Group.objects.filter(is_active=True).count() if hasattr(Group.objects.first(), 'is_active') else 'N/A'
        
        self.stdout.write(f'\nGroups:')
        self.stdout.write(f'  Total: {total_groups}')
        self.stdout.write(f'  Active: {active_groups}')
        
        # Check Families
        try:
            total_families = Family.objects.count()
            self.stdout.write(f'\nFamilies:')
            self.stdout.write(f'  Total: {total_families}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Family check failed: {e}'))
        
        # Check Users
        try:
            total_users = User.objects.count()
            admin_users = User.objects.filter(is_superuser=True).count()
            staff_users = User.objects.filter(is_staff=True).count()
            
            self.stdout.write(f'\nUsers:')
            self.stdout.write(f'  Total: {total_users}')
            self.stdout.write(f'  Superusers: {admin_users}')
            self.stdout.write(f'  Staff: {staff_users}')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ User check failed: {e}'))
        
        # Check for duplicate emails
        from django.db.models import Count
        duplicate_emails = Member.objects.values('email').annotate(count=Count('email')).filter(count__gt=1)
        if duplicate_emails.exists():
            self.stdout.write(self.style.WARNING(f'⚠ Found {duplicate_emails.count()} duplicate email addresses'))
            for dup in duplicate_emails[:5]:
                self.stdout.write(f'    Email: {dup["email"]} ({dup["count"]} times)')

    def test_api_endpoints(self, user_email=None):
        """Test API endpoints that dashboard uses"""
        self.stdout.write('\n--- API Endpoints Test ---')
        
        client = Client()
        
        # Get or create test user
        if user_email:
            try:
                user = User.objects.get(email=user_email)
                self.stdout.write(f'Using user: {user.email}')
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User {user_email} not found'))
                return
        else:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.filter(is_staff=True).first()
            if not user:
                self.stdout.write(self.style.WARNING('No admin user found for testing - testing without authentication'))
                user = None
        
        if user:
            # Login the user
            client.force_login(user)
            self.stdout.write(f'Using user: {user.email}')
        else:
            self.stdout.write('Testing endpoints without authentication')
        
        # Test endpoints from your logs
        endpoints = [
            ('/api/v1/auth/verify/', 'Auth verification'),
            ('/api/v1/core/dashboard/stats/', 'Dashboard stats'),
            ('/api/v1/members/statistics/?range=30d', 'Member statistics'),
            ('/api/v1/members/recent/?limit=5', 'Recent members'),
            ('/api/v1/members/', 'Members list'),
            ('/api/v1/groups/statistics/', 'Group statistics'),
            ('/api/v1/families/statistics/', 'Family statistics'),
            ('/api/v1/core/dashboard/health/', 'System health'),
            ('/api/v1/core/dashboard/alerts/', 'Dashboard alerts'),
        ]
        
        for url, description in endpoints:
            try:
                response = client.get(url)
                status_icon = '✓' if response.status_code == 200 else '✗'
                status_color = self.style.SUCCESS if response.status_code == 200 else self.style.ERROR
                
                self.stdout.write(status_color(f'{status_icon} {description}: {response.status_code}'))
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            if 'results' in data:
                                self.stdout.write(f'    Results count: {len(data["results"]) if data["results"] else 0}')
                            elif 'count' in data:
                                self.stdout.write(f'    Count: {data["count"]}')
                            elif 'summary' in data:
                                self.stdout.write(f'    Summary: {data["summary"]}')
                            else:
                                # Show first few keys
                                keys = list(data.keys())[:3]
                                self.stdout.write(f'    Keys: {keys}')
                    except (ValueError, json.JSONDecodeError):
                        self.stdout.write(f'    Response length: {len(response.content)}')
                else:
                    self.stdout.write(f'    Error: {response.content[:100].decode()}')
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ {description}: Exception - {e}'))

    def check_user_permissions(self, user_email=None):
        """Check user permissions and roles"""
        self.stdout.write('\n--- User Permissions Check ---')
        
        if user_email:
            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User {user_email} not found'))
                return
        else:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                self.stdout.write(self.style.WARNING('No admin user found'))
                return
        
        self.stdout.write(f'User: {user.email}')
        self.stdout.write(f'  Superuser: {user.is_superuser}')
        self.stdout.write(f'  Staff: {user.is_staff}')
        self.stdout.write(f'  Active: {user.is_active}')
        
        if hasattr(user, 'role'):
            self.stdout.write(f'  Role: {user.role}')
        
        # Check groups/permissions
        if hasattr(user, 'groups') and user.groups.exists():
            self.stdout.write(f'  Groups: {[g.name for g in user.groups.all()]}')
        
        if hasattr(user, 'user_permissions') and user.user_permissions.exists():
            self.stdout.write(f'  Permissions: {[p.codename for p in user.user_permissions.all()]}')

    def fix_common_issues(self):
        """Fix common data issues"""
        self.stdout.write('\n--- Fixing Common Issues ---')
        
        # Fix null email addresses
        members_without_email = Member.objects.filter(email__isnull=True)
        if members_without_email.exists():
            self.stdout.write(f'Found {members_without_email.count()} members without email')
            # Don't auto-fix this as it might be intentional
        
        # Fix inactive members registration dates
        from django.utils import timezone
        members_without_reg_date = Member.objects.filter(registration_date__isnull=True)
        if members_without_reg_date.exists():
            count = members_without_reg_date.update(registration_date=timezone.now())
            self.stdout.write(self.style.SUCCESS(f'✓ Fixed {count} members without registration date'))
        
        self.stdout.write('Common issues check complete')

    def create_test_data(self):
        """Create test data for debugging"""
        self.stdout.write('\n--- Creating Test Data ---')
        
        from django.utils import timezone
        import random
        
        # Create test members
        test_members = [
            {
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'john.doe@example.com',
                'phone': '+233241234567'
            },
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@example.com',
                'phone': '+233241234568'
            },
            {
                'first_name': 'Michael',
                'last_name': 'Johnson',
                'email': 'michael.johnson@example.com',
                'phone': '+233241234569'
            }
        ]
        
        created_count = 0
        for member_data in test_members:
            member, created = Member.objects.get_or_create(
                email=member_data['email'],
                defaults={
                    **member_data,
                    'is_active': True,
                    'registration_date': timezone.now() - timezone.timedelta(days=random.randint(1, 30)),
                    'registration_source': 'debug_tool'
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'  Created member: {member.first_name} {member.last_name}')
        
        # if created_count > 0:
        #     self.stdout.write(self.style.SUCCESS(f'✓ Created {created_count} test members'))
        # else:
        #     self.stdout.write('All test members already exist')
        
        # # Create test admin user if needed - with proper username and password
        # admin_email = 'admin@churchconnect.local'
        # admin_username = 'churchadmin'  # Add a non-reserved username
        # admin_password = 'admin123'     # Add a password
        
        # try:
        #     admin_user = User.objects.get(email=admin_email)
        #     self.stdout.write(f'Admin user already exists: {admin_email}')
        # except User.DoesNotExist:
        #     try:
        #         # Try to create admin user with all required fields
        #         admin_user = User.objects.create(
        #             email=admin_email,
        #             username=admin_username,      # Add username
        #             first_name='Admin',
        #             last_name='User',
        #             is_staff=True,
        #             is_superuser=True,
        #             is_active=True
        #         )
        #         # Set password separately
        #         admin_user.set_password(admin_password)
        #         admin_user.save()
                
        #         self.stdout.write(self.style.SUCCESS(f'✓ Created admin user: {admin_email}'))
        #         self.stdout.write(self.style.SUCCESS(f'  Username: {admin_username}'))
        #         self.stdout.write(self.style.SUCCESS(f'  Password: {admin_password}'))
                
        #     except Exception as e:
        #         self.stdout.write(self.style.WARNING(f'⚠ Could not create admin user: {e}'))
                
        #         # Try alternative username if the first one is reserved
        #         try:
        #             admin_username_alt = 'church_admin_' + str(random.randint(1000, 9999))
        #             admin_user = User.objects.create(
        #                 email=admin_email,
        #                 username=admin_username_alt,  # Use alternative username
        #                 first_name='Admin',
        #                 last_name='User',
        #                 is_staff=True,
        #                 is_superuser=True,
        #                 is_active=True
        #             )
        #             admin_user.set_password(admin_password)
        #             admin_user.save()
                    
        #             self.stdout.write(self.style.SUCCESS(f'✓ Created admin user with alternative username: {admin_email}'))
        #             self.stdout.write(self.style.SUCCESS(f'  Username: {admin_username_alt}'))
        #             self.stdout.write(self.style.SUCCESS(f'  Password: {admin_password}'))
                    
        #         except Exception as e2:
        #             self.stdout.write(self.style.ERROR(f'✗ Failed to create admin user: {e2}'))
        #             self.stdout.write(self.style.WARNING('  You may need to create an admin user manually using:'))
        #             self.stdout.write(self.style.WARNING(f'  Email: {admin_email}'))
        #             self.stdout.write(self.style.WARNING(f'  Username: {admin_username_alt} (or choose another)'))
        #             self.stdout.write(self.style.WARNING(f'  Password: {admin_password}'))