# members/management/commands/create_mock_members.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from members.models import Member
import random

class Command(BaseCommand):
    help = 'Create mock members for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Number of mock members to create'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        # Sample data
        first_names = [
            'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma',
            'Robert', 'Anna', 'William', 'Maria', 'Richard', 'Lisa', 'Thomas',
            'Jennifer', 'Charles', 'Patricia', 'Christopher', 'Linda', 'Daniel',
            'Barbara', 'Matthew', 'Susan', 'Anthony', 'Jessica', 'Mark', 'Karen',
            'Donald', 'Nancy', 'Steven', 'Betty', 'Paul', 'Helen', 'Andrew',
            'Sandra', 'Joshua', 'Donna', 'Kenneth', 'Carol', 'Kevin', 'Ruth',
            'Brian', 'Sharon', 'George', 'Michelle', 'Timothy', 'Laura', 'Ronald',
            'Sarah'
        ]
        
        last_names = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
            'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
            'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
            'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
            'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
            'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
            'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
            'Carter', 'Roberts'
        ]
        
        # Delete existing mock members
        existing_count = Member.objects.filter(email__contains='@mockchurch.test').count()
        if existing_count > 0:
            Member.objects.filter(email__contains='@mockchurch.test').delete()
            self.stdout.write(
                self.style.WARNING(f'Deleted {existing_count} existing mock members')
            )
        
        created_members = []
        
        for i in range(count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            
            # Generate random birth date (between 18 and 80 years old)
            today = date.today()
            min_age = 18
            max_age = 80
            birth_year = today.year - random.randint(min_age, max_age)
            birth_month = random.randint(1, 12)
            birth_day = random.randint(1, 28)  # Safe day for all months
            birth_date = date(birth_year, birth_month, birth_day)
            
            # Generate mock data
            member_data = {
                'first_name': first_name,
                'last_name': last_name,
                'email': f'{first_name.lower()}.{last_name.lower()}{i}@mockchurch.test',
                'phone': f'555{random.randint(1000000, 9999999)}',
                'date_of_birth': birth_date,
                'gender': random.choice(['M', 'F', 'O']),
                'address': f'{random.randint(100, 9999)} {random.choice(["Main", "Oak", "Pine", "Elm", "Cedar"])} St',
                'city': random.choice(['Springfield', 'Franklin', 'Georgetown', 'Madison', 'Riverside']),
                'state': random.choice(['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH']),
                'zip_code': f'{random.randint(10000, 99999)}',
                'occupation': random.choice([
                    'Teacher', 'Engineer', 'Nurse', 'Manager', 'Sales', 'Accountant',
                    'Developer', 'Designer', 'Consultant', 'Analyst', 'Coordinator',
                    'Specialist', 'Assistant', 'Supervisor', 'Director', 'Administrator'
                ]),
                'marital_status': random.choice(['single', 'married', 'divorced', 'widowed']),
                'is_active': random.choice([True, True, True, True, False]),  # 80% active
                'registration_date': timezone.now().date() - timedelta(days=random.randint(1, 730)),
                'registration_source': 'mock_data',
                'notes': f'Mock member created for testing - Member #{i+1}'
            }
            
            try:
                member = Member.objects.create(**member_data)
                created_members.append(member)
                
                if (i + 1) % 10 == 0:
                    self.stdout.write(f'Created {i + 1}/{count} members...')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error creating member {i+1}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(created_members)} mock members!'
            )
        )
        
        # Display some statistics
        total_members = Member.objects.count()
        active_members = Member.objects.filter(is_active=True).count()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nDatabase now contains:'
                f'\n  - Total members: {total_members}'
                f'\n  - Active members: {active_members}'
                f'\n  - Inactive members: {total_members - active_members}'
            )
        )