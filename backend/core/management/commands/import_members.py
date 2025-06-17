# ================================================================

# File: backend/core/management/commands/import_members.py
import csv
from django.core.management.base import BaseCommand
from django.db import transaction
from members.models import Member
from groups.models import Group
from datetime import datetime

class Command(BaseCommand):
    help = 'Import members from CSV file'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to CSV file containing member data',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without saving data',
        )
    
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write('Performing dry run - no data will be saved')
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                created_count = 0
                updated_count = 0
                error_count = 0
                
                with transaction.atomic():
                    for row_num, row in enumerate(reader, start=2):
                        try:
                            # Parse member data
                            email = row.get('email', '').strip()
                            if not email:
                                self.stdout.write(f'Row {row_num}: Missing email, skipping')
                                error_count += 1
                                continue
                            
                            # Check if member exists
                            member, created = Member.objects.get_or_create(
                                email=email,
                                defaults={
                                    'first_name': row.get('first_name', '').strip(),
                                    'last_name': row.get('last_name', '').strip(),
                                    'phone': row.get('phone', '').strip(),
                                    'date_of_birth': self._parse_date(row.get('date_of_birth')),
                                    'gender': row.get('gender', 'prefer_not_to_say').lower(),
                                    'address': row.get('address', '').strip(),
                                    'preferred_contact_method': row.get('preferred_contact_method', 'email').lower(),
                                    'registration_date': datetime.now(),
                                    'is_active': True,
                                }
                            )
                            
                            if created:
                                created_count += 1
                                self.stdout.write(f'Row {row_num}: Created member {email}')
                            else:
                                # Update existing member
                                updated_fields = []
                                if row.get('first_name') and member.first_name != row['first_name'].strip():
                                    member.first_name = row['first_name'].strip()
                                    updated_fields.append('first_name')
                                
                                if row.get('last_name') and member.last_name != row['last_name'].strip():
                                    member.last_name = row['last_name'].strip()
                                    updated_fields.append('last_name')
                                
                                if row.get('phone') and member.phone != row['phone'].strip():
                                    member.phone = row['phone'].strip()
                                    updated_fields.append('phone')
                                
                                if updated_fields:
                                    member.save()
                                    updated_count += 1
                                    self.stdout.write(f'Row {row_num}: Updated member {email} ({", ".join(updated_fields)})')
                            
                            # Handle group assignments
                            groups_field = row.get('groups', '').strip()
                            if groups_field:
                                group_names = [name.strip() for name in groups_field.split(',')]
                                for group_name in group_names:
                                    try:
                                        group = Group.objects.get(name=group_name)
                                        member.groups.add(group)
                                    except Group.DoesNotExist:
                                        self.stdout.write(f'Row {row_num}: Group "{group_name}" not found')
                            
                        except Exception as e:
                            error_count += 1
                            self.stdout.write(f'Row {row_num}: Error - {str(e)}')
                    
                    if dry_run:
                        # Rollback transaction for dry run
                        transaction.set_rollback(True)
                
                # Summary
                self.stdout.write('\n--- Import Summary ---')
                self.stdout.write(f'Members created: {created_count}')
                self.stdout.write(f'Members updated: {updated_count}')
                self.stdout.write(f'Errors: {error_count}')
                
                if dry_run:
                    self.stdout.write('\nDry run completed - no data was saved')
                else:
                    self.stdout.write(f'\nImport completed successfully')
                
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_file}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Import failed: {str(e)}'))
    
    def _parse_date(self, date_str):
        """Parse date string in various formats."""
        if not date_str:
            return None
        
        date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt).date()
            except ValueError:
                continue
        
        return None