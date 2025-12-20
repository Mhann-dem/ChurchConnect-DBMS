# backend/reports/management/commands/create_report_templates.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from reports.models import ReportTemplate

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default report templates'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'Active Members Export',
                'description': 'Export all active members with contact information',
                'report_type': 'members',
                'default_format': 'excel',
                'default_columns': [
                    'id', 'first_name', 'last_name', 'email', 'phone',
                    'date_joined', 'status', 'family_name'
                ],
                'default_filters': {'status': 'active'},
            },
            {
                'name': 'Monthly Pledges Report',
                'description': 'Generate monthly pledges and donations report',
                'report_type': 'pledges',
                'default_format': 'excel',
                'default_columns': [
                    'id', 'member_name', 'amount', 'date', 'status', 'category'
                ],
                'default_filters': {},
            },
            {
                'name': 'Group Directory',
                'description': 'Export all groups with member counts and leaders',
                'report_type': 'groups',
                'default_format': 'pdf',
                'default_columns': [
                    'id', 'name', 'description', 'leader', 'member_count'
                ],
                'default_filters': {},
            },
            {
                'name': 'Family Report',
                'description': 'Family structure and member associations',
                'report_type': 'families',
                'default_format': 'excel',
                'default_columns': [
                    'id', 'name', 'head_member', 'member_count', 'created_date'
                ],
                'default_filters': {},
            },
            {
                'name': 'Church Statistics',
                'description': 'Summary statistics and key metrics',
                'report_type': 'statistics',
                'default_format': 'pdf',
                'default_columns': [
                    'total_members', 'active_members', 'total_families',
                    'total_groups', 'total_pledges', 'total_pledge_amount'
                ],
                'default_filters': {},
            },
        ]

        created_count = 0
        for template_data in templates:
            template_data['is_system_template'] = True
            
            template, created = ReportTemplate.objects.get_or_create(
                name=template_data['name'],
                is_system_template=True,
                defaults=template_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⊘ Template already exists: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Successfully created {created_count} report templates!')
        )
