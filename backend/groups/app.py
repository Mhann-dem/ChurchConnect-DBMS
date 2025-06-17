
# backend/churchconnect/groups/apps.py
from django.apps import AppConfig


class GroupsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'groups'
    verbose_name = 'Groups and Ministries'


# backend/churchconnect/groups/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from datetime import date

from .models import Group, GroupCategory, MemberGroupRelationship
from members.models import Member

User = get_user_model()


class GroupModelTest(TestCase):
    """Test cases for Group model"""
    
    def setUp(self):
        self.member = Member.objects.create(
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            phone='1234567890',
            date_of_birth=date(1990, 1, 1),
            gender='male'
        )
        
        self.group = Group.objects.create(
            name='Bible Study Group',
            description='Weekly Bible study',
            leader=self.member,
            max_capacity=10
        )

    def test_group_creation(self):
        """Test group is created correctly"""
        self.assertEqual(self.group.name, 'Bible Study Group')
        self.assertEqual(self.group.leader, self.member)
        self.assertEqual(self.group.member_count, 0)
        self.assertFalse(self.group.is_full)

    def test_group_member_count(self):
        """Test member count calculation"""
        # Add a member to the group
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            is_active=True
        )
        
        # Refresh group instance
        self.group.refresh_from_db()
        self.assertEqual(self.group.member_count, 1)

    def test_group_capacity_check(self):
        """Test group capacity checking"""
        # Fill the group to capacity
        for i in range(10):
            member = Member.objects.create(
                first_name=f'Member{i}',
                last_name='Test',
                email=f'member{i}@example.com',
                phone=f'123456789{i}',
                date_of_birth=date(1990, 1, 1),
                gender='male'
            )
            MemberGroupRelationship.objects.create(
                member=member,
                group=self.group,
                is_active=True
            )
        
        self.group.refresh_from_db()
        self.assertTrue(self.group.is_full)

    def test_get_leader_name(self):
        """Test leader name retrieval"""
        self.assertEqual(self.group.get_leader_name(), 'John Doe')
        
        # Test with leader_name field
        group_no_leader = Group.objects.create(
            name='Another Group',
            leader_name='External Leader'
        )
        self.assertEqual(group_no_leader.get_leader_name(), 'External Leader')


class GroupAPITest(APITestCase):
    """Test cases for Group API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123'
        )
        
        self.member = Member.objects.create(
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            phone='1234567890',
            date_of_birth=date(1990, 1, 1),
            gender='male'
        )
        
        self.category = GroupCategory.objects.create(
            name='Ministry',
            description='Church ministries'
        )
        
        self.group = Group.objects.create(
            name='Youth Group',
            description='Youth ministry',
            leader=self.member
        )

    def test_public_group_list(self):
        """Test public access to group list"""
        url = reverse('group-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authenticated_group_creation(self):
        """Test group creation with authentication"""
        self.client.force_authenticate(user=self.user)
        url = reverse('group-list')
        data = {
            'name': 'New Group',
            'description': 'A new group',
            'is_active': True,
            'is_public': True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_group_join_action(self):
        """Test joining a group"""
        self.client.force_authenticate(user=self.user)
        url = reverse('group-join', kwargs={'pk': self.group.pk})
        data = {'member_id': str(self.member.id)}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check membership was created
        membership = MemberGroupRelationship.objects.get(
            member=self.member, 
            group=self.group
        )
        self.assertEqual(membership.status, 'active')

    def test_group_stats(self):
        """Test group statistics endpoint"""
        url = reverse('group-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_groups', response.data)
        self.assertIn('active_groups', response.data)