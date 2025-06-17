# ================================================================

# File: backend/core/management/commands/backup_data.py
import os
import datetime
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings

class Command(BaseCommand):
    help = 'Create a backup of church data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='backups',
            help='Directory to store backup files',
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['json', 'xml'],
            default='json',
            help='Backup format',
        )
    
    def handle(self, *args, **options):
        output_dir = options['output_dir']
        backup_format = options['format']
        
        # Create backup directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate timestamp for filename
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'churchconnect_backup_{timestamp}.{backup_format}'
        backup_path = os.path.join(output_dir, backup_filename)
        
        self.stdout.write(f'Creating backup: {backup_path}')
        
        try:
            # Create data dump
            call_command(
                'dumpdata',
                '--exclude=contenttypes',
                '--exclude=auth.permission',
                '--exclude=sessions',
                '--exclude=admin.logentry',
                f'--output={backup_path}',
                f'--format={backup_format}',
                '--indent=2'
            )
            
            # Get file size
            file_size = os.path.getsize(backup_path)
            size_mb = file_size / (1024 * 1024)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Backup created successfully: {backup_filename} ({size_mb:.2f} MB)'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Backup failed: {str(e)}')
            )
