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
        elif sys.argv[1] == 'backup_data':
            backup_church_data()
        elif sys.argv[1] == 'import_members':
            import_members_from_csv()
    
    execute_from_command_line(sys.argv)


def setup_initial_church_data():
    """Set up initial church data and admin user."""
    print("Setting up initial church data...")
    from django.core.management import call_command
    
    # Run migrations
    call_command('migrate')
    
    # Create superuser if not exists
    from django.contrib.auth import get_user_model
    from authentication.models import AdminUser
    
    User = get_user_model()
    if not AdminUser.objects.filter(username='admin').exists():
        AdminUser.objects.create_superuser(
            username='admin',
            email='admin@church.local',
            password='changeme123',
            first_name='Church',
            last_name='Administrator'
        )
        print("Created default admin user: admin/changeme123")
    
    # Create default groups
    from groups.models import Group
    default_groups = [
        {'name': 'Youth Ministry', 'description': 'Youth and young adults ministry'},
        {'name': 'Worship Team', 'description': 'Music and worship ministry'},
        {'name': 'Children\'s Ministry', 'description': 'Children\'s programs and education'},
        {'name': 'Seniors Ministry', 'description': 'Senior adults ministry'},
        {'name': 'Small Groups', 'description': 'Bible study and fellowship groups'},
    ]
    
    for group_data in default_groups:
        group, created = Group.objects.get_or_create(
            name=group_data['name'],
            defaults={'description': group_data['description']}
        )
        if created:
            print(f"Created group: {group.name}")
    
    print("Initial setup complete!")


def backup_church_data():
    """Create a backup of church data."""
    print("Creating data backup...")
    from django.core.management import call_command
    import datetime
    
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backup_churchconnect_{timestamp}.json'
    
    call_command('dumpdata', 
                 '--exclude=contenttypes', 
                 '--exclude=auth.permission',
                 '--exclude=sessions',
                 '--output=backups/' + backup_file)
    
    print(f"Backup created: backups/{backup_file}")


def import_members_from_csv():
    """Import members from CSV file."""
    print("Importing members from CSV...")
    # This would be implemented as a custom management command
    # For now, just a placeholder
    print("CSV import functionality - implement in core/management/commands/")


if __name__ == '__main__':
    main()
