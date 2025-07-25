# ================================================================
# File: backend/manage.py
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # Set the default Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'churchconnect.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Custom management commands for ChurchConnect
    if len(sys.argv) > 1:
        # Add custom commands
        if sys.argv[1] == 'setup_church':
            setup_initial_church_data()
            return
        elif sys.argv[1] == 'backup_data':
            backup_church_data()
            return
        elif sys.argv[1] == 'import_members':
            import_members_from_csv()
            return
    
    execute_from_command_line(sys.argv)


def setup_initial_church_data():
    """Set up initial church data and admin user."""
    print("Setting up initial church data...")
    
    # Import Django here to ensure it's properly configured
    import django
    django.setup()
    
    from django.core.management import call_command
    
    # Run migrations first
    print("Running migrations...")
    call_command('migrate')
    
    # Now it's safe to import models
    try:
        from authentication.models import AdminUser
        from groups.models import Group
        
        # Create superuser if not exists
        if not AdminUser.objects.filter(username='admin').exists():
            admin_user = AdminUser.objects.create_superuser(
                username='admin',
                email='admin@church.local',
                password='changeme123',
                first_name='Church',
                last_name='Administrator'
            )
            print("Created default admin user: admin/changeme123")
            print("⚠️  IMPORTANT: Please change the default password after first login!")
        else:
            print("Admin user already exists.")
        
        # Create default groups
        default_groups = [
            {'name': 'Youth Ministry', 'description': 'Youth and young adults ministry'},
            {'name': 'Worship Team', 'description': 'Music and worship ministry'},
            {'name': 'Children\'s Ministry', 'description': 'Children\'s programs and education'},
            {'name': 'Seniors Ministry', 'description': 'Senior adults ministry'},
            {'name': 'Small Groups', 'description': 'Bible study and fellowship groups'},
        ]
        
        created_groups = 0
        for group_data in default_groups:
            group, created = Group.objects.get_or_create(
                name=group_data['name'],
                defaults={'description': group_data['description']}
            )
            if created:
                print(f"Created group: {group.name}")
                created_groups += 1
        
        if created_groups == 0:
            print("All default groups already exist.")
        
        print("✅ Initial setup complete!")
        
    except ImportError as e:
        print(f"❌ Error importing models: {e}")
        print("Make sure all apps are properly installed and migrations are up to date.")
    except Exception as e:
        print(f"❌ Error during setup: {e}")


def backup_church_data():
    """Create a backup of church data."""
    import django
    django.setup()
    
    print("Creating data backup...")
    from django.core.management import call_command
    import datetime
    import os
    
    # Create backups directory if it doesn't exist
    backup_dir = 'backups'
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backup_churchconnect_{timestamp}.json'
    backup_path = os.path.join(backup_dir, backup_file)
    
    try:
        call_command('dumpdata', 
                     '--exclude=contenttypes', 
                     '--exclude=auth.permission',
                     '--exclude=sessions',
                     '--output=' + backup_path)
        
        print(f"✅ Backup created: {backup_path}")
    except Exception as e:
        print(f"❌ Error creating backup: {e}")


def import_members_from_csv():
    """Import members from CSV file."""
    import django
    django.setup()
    
    print("Importing members from CSV...")
    print("📝 This feature should be implemented as a Django management command.")
    print("Create: core/management/commands/import_members.py")
    print("Then run: python manage.py import_members --file=members.csv")


if __name__ == '__main__':
    main()