from django.core.management.base import BaseCommand
from members.models import Member
from families.models import Family
from groups.models import Group
# Ensure 'pledges' app is in INSTALLED_APPS and 'models.py' exists in 'pledges'
try:
    from pledges.models import Pledge
except ModuleNotFoundError:
    Pledge = None  # or handle the error appropriately
from authentication.models import User
import random
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Loads sample data into the database'

    def handle(self, *args, **options):
        # Create test users
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@church.com',
            password='admin123',
            role='super_admin'
        )
        
        # Create families
        family_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones']
        families = []
        for name in family_names:
            family = Family.objects.create(family_name=name)
            families.append(family)
        
        # Create members
        first_names = ['John', 'Jane', 'Michael', 'Emily', 'David']
        last_names = family_names * 2  # Duplicate to have more combinations
        
        for i in range(20):
            family = random.choice(families) if i % 3 == 0 else None
            Member.objects.create(
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                email=f"user{i}@example.com",
                phone=f"555-{1000+i}",
                date_of_birth=date.today() - timedelta(days=random.randint(365*20, 365*70)),
                gender=random.choice(['male', 'female']),
                family=family,
                created_by=admin
            )
        
        # Create groups
        group_types = ['ministry', 'small_group', 'committee']
        groups = []
        for i in range(5):
            group = Group.objects.create(
                name=f"Group {i+1}",
                group_type=random.choice(group_types),
                leader_name=f"Leader {i+1}",
                created_by=admin
            )
            groups.append(group)
        
        # Create pledges
        members = Member.objects.all()
        for member in members[:10]:  # First 10 members make pledges
            Pledge.objects.create(
                member=member,
                amount=random.randint(50, 500),
                frequency=random.choice(['monthly', 'weekly', 'one-time']),
                start_date=date.today(),
                created_by=admin
            )
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded sample data'))