# backend/churchconnect/families/management/commands/manage_families.py

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import csv
import json
from families.models import Family, FamilyRelationship
from members.models import Member


class Command(BaseCommand):
    """
    Management command for family data operations
    Supports initialization, cleanup, and maintenance tasks
    """
    
    help = 'Manage family data - cleanup, initialization, and maintenance'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            type=str,
            choices=[
                'cleanup', 'validate', 'stats', 'export', 
                'fix_orphans', 'init_sample_data', 'audit'
            ],
            help='Action to perform'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        
        parser.add_argument(
            '--output',
            type=str,
            help='Output file for exports',
            default='family_export.csv'
        )
        
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days for time-based operations'
        )

    def handle(self, *args, **options):
        action = options['action']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))

        try:
            if action == 'cleanup':
                self.cleanup_families(dry_run)
            elif action == 'validate':
                self.validate_families()
            elif action == 'stats':
                self.show_statistics()
            elif action == 'export':
                self.export_families(options['output'])
            elif action == 'fix_orphans':
                self.fix_orphan_members(dry_run)
            elif action == 'init_sample_data':
                self.initialize_sample_data(dry_run)
            elif action == 'audit':
                self.audit_families(options['days'])
            
        except Exception as e:
            raise CommandError(f'Error executing {action}: {str(e)}')

    def cleanup_families(self, dry_run=False):
        """Clean up inconsistent family data"""
        self.stdout.write("Starting family data cleanup...")
        
        # Find empty families
        empty_families = Family.objects.annotate(
            member_count=models.Count('family_relationships')
        ).filter(member_count=0)
        
        self.stdout.write(f"Found {empty_families.count()} empty families")
        
        if not dry_run and empty_families.exists():
            deleted_count = empty_families.count()
            empty_families.delete()
            self.stdout.write(
                self.style.SUCCESS(f'Deleted {deleted_count} empty families')
            )
        
        # Find families with invalid primary contacts
        invalid_primary_contacts = Family.objects.exclude(
            primary_contact__in=Member.objects.all()
        ).filter(primary_contact__isnull=False)
        
        self.stdout.write(f"Found {invalid_primary_contacts.count()} families with invalid primary contacts")
        
        if not dry_run and invalid_primary_contacts.exists():
            updated_count = invalid_primary_contacts.update(primary_contact=None)
            self.stdout.write(
                self.style.SUCCESS(f'Fixed {updated_count} invalid primary contacts')
            )
        
        # Find duplicate family names
        from django.db.models import Count
        duplicate_names = Family.objects.values('family_name').annotate(
            count=Count('id')
        ).filter(count__gt=1)
        
        if duplicate_names.exists():
            self.stdout.write(
                self.style.WARNING(f'Found {duplicate_names.count()} duplicate family names')
            )
            for dup in duplicate_names:
                self.stdout.write(f"  - {dup['family_name']}: {dup['count']} families")

    def validate_families(self):
        """Validate family data integrity"""
        self.stdout.write("Validating family data...")
        
        issues = []
        
        # Check for families without primary contact
        no_primary_contact = Family.objects.filter(primary_contact__isnull=True).count()
        if no_primary_contact:
            issues.append(f"{no_primary_contact} families without primary contact")
        
        # Check for families without head of household
        families_without_head = Family.objects.exclude(
            family_relationships__relationship_type='head'
        ).count()
        if families_without_head:
            issues.append(f"{families_without_head} families without head of household")
        
        # Check for families with multiple heads
        from django.db.models import Count
        multiple_heads = Family.objects.annotate(
            head_count=Count('family_relationships', 
                           filter=models.Q(family_relationships__relationship_type='head'))
        ).filter(head_count__gt=1).count()
        if multiple_heads:
            issues.append(f"{multiple_heads} families with multiple heads of household")
        
        # Check for members without family_id set correctly
        incorrect_family_ids = FamilyRelationship.objects.exclude(
            member__family_id=models.F('family_id')
        ).count()
        if incorrect_family_ids:
            issues.append(f"{incorrect_family_ids} members with incorrect family_id")
        
        if issues:
            self.stdout.write(self.style.ERROR("Validation issues found:"))
            for issue in issues:
                self.stdout.write(f"  - {issue}")
        else:
            self.stdout.write(self.style.SUCCESS("All validations passed!"))

    def show_statistics(self):
        """Show comprehensive family statistics"""
        self.stdout.write("Family Statistics:")
        self.stdout.write("=" * 50)
        
        # Basic counts
        total_families = Family.objects.count()
        total_relationships = FamilyRelationship.objects.count()
        
        self.stdout.write(f"Total Families: {total_families}")
        self.stdout.write(f"Total Family Relationships: {total_relationships}")
        
        # Family size distribution
        from django.db.models import Count
        size_distribution = Family.objects.annotate(
            member_count=Count('family_relationships')
        ).values('member_count').annotate(
            family_count=Count('id')
        ).order_by('member_count')
        
        self.stdout.write("\nFamily Size Distribution:")
        for size in size_distribution:
            self.stdout.write(f"  {size['member_count']} members: {size['family_count']} families")
        
        # Relationship type distribution
        relationship_distribution = FamilyRelationship.objects.values(
            'relationship_type'
        ).annotate(
            count=Count('id')
        ).order_by('-count')
        
        self.stdout.write("\nRelationship Type Distribution:")
        for rel in relationship_distribution:
            self.stdout.write(f"  {rel['relationship_type'].title()}: {rel['count']}")
        
        # Recent activity
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_families = Family.objects.filter(created_at__gte=thirty_days_ago).count()
        recent_relationships = FamilyRelationship.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()
        
        self.stdout.write(f"\nRecent Activity (last 30 days):")
        self.stdout.write(f"  New families: {recent_families}")
        self.stdout.write(f"  New relationships: {recent_relationships}")

    def export_families(self, output_file):
        """Export family data to CSV"""
        self.stdout.write(f"Exporting family data to {output_file}...")
        
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([
                'Family ID', 'Family Name', 'Primary Contact Name',
                'Primary Contact Email', 'Address', 'Member Count',
                'Children Count', 'Adults Count', 'Created Date'
            ])
            
            # Write family data
            families = Family.objects.select_related('primary_contact').annotate(
                member_count=Count('family_relationships'),
                children_count=Count(
                    'family_relationships',
                    filter=models.Q(family_relationships__relationship_type='child')
                ),
                adults_count=Count(
                    'family_relationships',
                    filter=models.Q(family_relationships__relationship_type__in=['head', 'spouse'])
                )
            )
            
            for family in families:
                writer.writerow([
                    family.id,
                    family.family_name,
                    family.primary_contact.get_full_name() if family.primary_contact else '',
                    family.primary_contact.email if family.primary_contact else '',
                    family.address or '',
                    family.member_count,
                    family.children_count,
                    family.adults_count,
                    family.created_at.strftime('%Y-%m-%d')
                ])
        
        self.stdout.write(self.style.SUCCESS(f"Export completed: {output_file}"))

    def fix_orphan_members(self, dry_run=False):
        """Fix members who have family_id but no family relationship"""
        self.stdout.write("Checking for orphan members...")
        
        # Find members with family_id but no relationship
        orphan_members = Member.objects.filter(
            family_id__isnull=False
        ).exclude(
            id__in=FamilyRelationship.objects.values_list('member_id', flat=True)
        )
        
        self.stdout.write(f"Found {orphan_members.count()} orphan members")
        
        if not dry_run and orphan_members.exists():
            updated_count = orphan_members.update(family_id=None)
            self.stdout.write(
                self.style.SUCCESS(f'Fixed {updated_count} orphan members')
            )

    def initialize_sample_data(self, dry_run=False):
        """Initialize sample family data for testing/demonstration"""
        self.stdout.write("Initializing sample family data...")
        
        if dry_run:
            self.stdout.write("Would create sample families and relationships")
            return
        
        sample_families_data = [
            {
                'family_name': 'Johnson Family',
                'address': '123 Oak Street, Anytown, USA',
                'members': [
                    {'name': 'Robert Johnson', 'relationship': 'head', 'dob': '1975-03-15'},
                    {'name': 'Mary Johnson', 'relationship': 'spouse', 'dob': '1978-07-22'},
                    {'name': 'Tommy Johnson', 'relationship': 'child', 'dob': '2005-11-10'},
                    {'name': 'Sarah Johnson', 'relationship': 'child', 'dob': '2008-04-18'},
                ]
            },
            {
                'family_name': 'Williams Family',
                'address': '456 Pine Avenue, Somewhere, USA',
                'members': [
                    {'name': 'David Williams', 'relationship': 'head', 'dob': '1980-12-03'},
                    {'name': 'Lisa Williams', 'relationship': 'spouse', 'dob': '1982-09-14'},
                ]
            }
        ]
        
        with transaction.atomic():
            for family_data in sample_families_data:
                # Check if family already exists
                if Family.objects.filter(family_name=family_data['family_name']).exists():
                    self.stdout.write(f"Family '{family_data['family_name']}' already exists, skipping")
                    continue
                
                # Create family
                family = Family.objects.create(
                    family_name=family_data['family_name'],
                    address=family_data['address']
                )
                
                primary_contact = None
                
                # Create members and relationships
                for member_data in family_data['members']:
                    first_name, last_name = member_data['name'].split(' ', 1)
                    
                    # Create member if doesn't exist
                    member, created = Member.objects.get_or_create(
                        first_name=first_name,
                        last_name=last_name,
                        defaults={
                            'email': f"{first_name.lower()}.{last_name.lower()}@example.com",
                            'phone': f"555-{hash(member_data['name']) % 10000:04d}",
                            'date_of_birth': member_data['dob'],
                            'gender': 'male' if member_data['relationship'] == 'head' else 'female'
                        }
                    )
                    
                    # Create relationship
                    FamilyRelationship.objects.create(
                        family=family,
                        member=member,
                        relationship_type=member_data['relationship']
                    )
                    
                    # Set primary contact as head of household
                    if member_data['relationship'] == 'head':
                        primary_contact = member
                
                # Update family with primary contact
                if primary_contact:
                    family.primary_contact = primary_contact
                    family.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f"Created family: {family.family_name}")
                )

    def audit_families(self, days=30):
        """Audit family changes over specified period"""
        self.stdout.write(f"Auditing family changes over last {days} days...")
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # New families
        new_families = Family.objects.filter(created_at__gte=cutoff_date)
        self.stdout.write(f"New families: {new_families.count()}")
        
        # Updated families
        updated_families = Family.objects.filter(
            updated_at__gte=cutoff_date,
            created_at__lt=cutoff_date
        )
        self.stdout.write(f"Updated families: {updated_families.count()}")
        
        # New relationships
        new_relationships = FamilyRelationship.objects.filter(created_at__gte=cutoff_date)
        self.stdout.write(f"New relationships: {new_relationships.count()}")
        
        # Show details if requested
        if new_families.exists():
            self.stdout.write("\nNew Families:")
            for family in new_families[:5]:  # Show first 5
                self.stdout.write(f"  - {family.family_name} ({family.created_at.strftime('%Y-%m-%d')})")
            if new_families.count() > 5:
                self.stdout.write(f"  ... and {new_families.count() - 5} more")