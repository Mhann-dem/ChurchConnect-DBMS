# backend/churchconnect/groups/tests.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from datetime import date, datetime
from django.utils import timezone
from unittest.mock import patch

from .models import Group, GroupCategory, MemberGroupRelationship, GroupCategoryRelationship
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
            gender='male',
            is_active=True
        )
        
        self.category = GroupCategory.objects.create(
            name='Ministry',
            description='Church ministries',
            is_active=True
        )
        
        self.group = Group.objects.create(
            name='Bible Study Group',
            description='Weekly Bible study',
            leader=self.member,
            max_capacity=10,
            is_active=True,
            is_public=True
        )

    def test_group_creation(self):
        """Test group is created correctly"""
        self.assertEqual(self.group.name, 'Bible Study Group')
        self.assertEqual(self.group.leader, self.member)
        self.assertEqual(self.group.member_count, 0)
        self.assertFalse(self.group.is_full)
        self.assertTrue(self.group.is_active)

    def test_group_str_representation(self):
        """Test string representation of group"""
        self.assertEqual(str(self.group), 'Bible Study Group')

    def test_group_member_count(self):
        """Test member count calculation"""
        # Add a member to the group
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            is_active=True,
            status='active'
        )
        
        # Check member count
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
                gender='male',
                is_active=True
            )
            MemberGroupRelationship.objects.create(
                member=member,
                group=self.group,
                is_active=True,
                status='active'
            )
        
        self.assertTrue(self.group.is_full)
        self.assertEqual(self.group.available_spots, 0)

    def test_get_leader_name(self):
        """Test leader name retrieval"""
        self.assertEqual(self.group.get_leader_name(), 'John Doe')
        
        # Test with leader_name field
        group_no_leader = Group.objects.create(
            name='Another Group',
            leader_name='External Leader'
        )
        self.assertEqual(group_no_leader.get_leader_name(), 'External Leader')

    def test_can_join_method(self):
        """Test can_join method"""
        new_member = Member.objects.create(
            first_name='Jane',
            last_name='Smith',
            email='jane@example.com',
            phone='9876543210',
            date_of_birth=date(1985, 5, 15),
            gender='female',
            is_active=True
        )
        
        # Should be able to join
        can_join, message = self.group.can_join(new_member)
        self.assertTrue(can_join)
        
        # Add member and try again
        MemberGroupRelationship.objects.create(
            member=new_member,
            group=self.group,
            is_active=True,
            status='active'
        )
        
        can_join, message = self.group.can_join(new_member)
        self.assertFalse(can_join)
        self.assertIn('already in this group', message)

    def test_pending_requests_count(self):
        """Test pending requests count"""
        # Create pending membership
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            status='pending',
            is_active=False
        )
        
        self.assertEqual(self.group.pending_requests_count, 1)


class MemberGroupRelationshipModelTest(TestCase):
    """Test cases for MemberGroupRelationship model"""
    
    def setUp(self):
        self.member = Member.objects.create(
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            phone='1234567890',
            date_of_birth=date(1990, 1, 1),
            gender='male',
            is_active=True
        )
        
        self.group = Group.objects.create(
            name='Youth Group',
            description='Youth ministry',
            is_active=True,
            is_public=True
        )

    def test_membership_creation(self):
        """Test membership creation"""
        membership = MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            role='member',
            status='active'
        )
        
        self.assertEqual(membership.member, self.member)
        self.assertEqual(membership.group, self.group)
        self.assertEqual(membership.role, 'member')
        self.assertEqual(membership.status, 'active')
        self.assertTrue(membership.is_active)

    def test_membership_str_representation(self):
        """Test string representation of membership"""
        membership = MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            role='leader'
        )
        
        expected = f"{self.member.get_full_name()} - {self.group.name} (Leader)"
        self.assertEqual(str(membership), expected)

    def test_membership_unique_constraint(self):
        """Test unique constraint on member-group combination"""
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group
        )
        
        # Should raise IntegrityError when creating duplicate
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            MemberGroupRelationship.objects.create(
                member=self.member,
                group=self.group
            )

    def test_membership_activation_deactivation(self):
        """Test membership activation and deactivation"""
        membership = MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            is_active=False,
            status='inactive'
        )
        
        # Test activation
        membership.activate()
        self.assertTrue(membership.is_active)
        self.assertEqual(membership.status, 'active')
        self.assertIsNone(membership.end_date)
        
        # Test deactivation
        membership.deactivate()
        self.assertFalse(membership.is_active)
        self.assertEqual(membership.status, 'inactive')
        self.assertIsNotNone(membership.end_date)

    def test_membership_validation(self):
        """Test membership validation"""
        from django.core.exceptions import ValidationError
        
        membership = MemberGroupRelationship(
            member=self.member,
            group=self.group,
            start_date=date(2024, 1, 15),
            end_date=date(2024, 1, 10),  # End before start
            is_active=True
        )
        
        with self.assertRaises(ValidationError):
            membership.clean()


class GroupCategoryModelTest(TestCase):
    """Test cases for GroupCategory model"""
    
    def setUp(self):
        self.category = GroupCategory.objects.create(
            name='Ministry',
            description='Church ministries',
            color='#FF0000',
            is_active=True
        )

    def test_category_creation(self):
        """Test category creation"""
        self.assertEqual(self.category.name, 'Ministry')
        self.assertEqual(self.category.color, '#FF0000')
        self.assertTrue(self.category.is_active)

    def test_category_str_representation(self):
        """Test string representation of category"""
        self.assertEqual(str(self.category), 'Ministry')

    def test_category_default_color(self):
        """Test default color assignment"""
        category = GroupCategory.objects.create(name='Test Category')
        self.assertEqual(category.color, '#3B82F6')


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
            gender='male',
            is_active=True
        )
        
        self.category = GroupCategory.objects.create(
            name='Ministry',
            description='Church ministries',
            is_active=True
        )
        
        self.group = Group.objects.create(
            name='Youth Group',
            description='Youth ministry',
            leader=self.member,
            is_active=True,
            is_public=True
        )
        
        GroupCategoryRelationship.objects.create(
            group=self.group,
            category=self.category
        )

    def test_public_group_list(self):
        """Test public access to group list"""
        url = reverse('group-public')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_authenticated_group_creation(self):
        """Test group creation with authentication"""
        self.client.force_authenticate(user=self.user)
        url = reverse('group-list')
        data = {
            'name': 'New Group',
            'description': 'A new group',
            'is_active': True,
            'is_public': True,
            'category_ids': [str(self.category.id)]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Group')

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

    def test_group_join_duplicate(self):
        """Test joining a group when already a member"""
        # Create existing membership
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            status='active'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('group-join', kwargs={'pk': self.group.pk})
        data = {'member_id': str(self.member.id)}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_group_remove_member(self):
        """Test removing a member from group"""
        # Create membership
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            status='active'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('group-remove-member', kwargs={'pk': self.group.pk, 'member_id': self.member.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check membership was deactivated
        membership = MemberGroupRelationship.objects.get(
            member=self.member,
            group=self.group
        )
        self.assertFalse(membership.is_active)

    def test_group_members_list(self):
        """Test getting group members"""
        # Create membership
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            status='active'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('group-members', kwargs={'pk': self.group.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_group_statistics(self):
        """Test group statistics endpoint"""
        url = reverse('group-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_groups', response.data)
        self.assertIn('active_groups', response.data)
        self.assertIn('categories', response.data)

    def test_group_approval_workflow(self):
        """Test group approval workflow"""
        # Create group requiring approval
        approval_group = Group.objects.create(
            name='Exclusive Group',
            requires_approval=True,
            is_active=True,
            is_public=True
        )
        
        # Join group (should be pending)
        self.client.force_authenticate(user=self.user)
        url = reverse('group-join', kwargs={'pk': approval_group.pk})
        data = {'member_id': str(self.member.id)}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        
        # Approve member
        url = reverse('group-approve-member', kwargs={'pk': approval_group.pk, 'member_id': self.member.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'active')

    def test_group_capacity_limit(self):
        """Test group capacity enforcement"""
        limited_group = Group.objects.create(
            name='Small Group',
            max_capacity=1,
            is_active=True,
            is_public=True
        )
        
        # Add first member
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=limited_group,
            status='active'
        )
        
        # Try to add second member
        new_member = Member.objects.create(
            first_name='Jane',
            last_name='Smith',
            email='jane@example.com',
            phone='9876543210',
            date_of_birth=date(1985, 5, 15),
            gender='female',
            is_active=True
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('group-join', kwargs={'pk': limited_group.pk})
        data = {'member_id': str(new_member.id)}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', response.data['error'].lower())


class GroupCategoryAPITest(APITestCase):
    """Test cases for GroupCategory API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123'
        )
        
        self.category = GroupCategory.objects.create(
            name='Ministry',
            description='Church ministries',
            is_active=True
        )

    def test_category_creation(self):
        """Test category creation"""
        self.client.force_authenticate(user=self.user)
        url = reverse('group-category-list')
        data = {
            'name': 'New Category',
            'description': 'A new category',
            'color': '#00FF00'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Category')

    def test_category_with_counts(self):
        """Test category with group counts"""
        # Create group in category
        group = Group.objects.create(name='Test Group', is_active=True)
        GroupCategoryRelationship.objects.create(
            group=group,
            category=self.category
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('group-category-with-counts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Find our category in results
        category_data = next(
            (cat for cat in response.data['results'] if cat['id'] == str(self.category.id)), 
            None
        )
        self.assertIsNotNone(category_data)
        self.assertEqual(category_data['group_count'], 1)


class MemberGroupRelationshipAPITest(APITestCase):
    """Test cases for MemberGroupRelationship API endpoints"""
    
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
            gender='male',
            is_active=True
        )
        
        self.group = Group.objects.create(
            name='Test Group',
            is_active=True,
            is_public=True
        )
        
        self.membership = MemberGroupRelationship.objects.create(
            member=self.member,
            group=self.group,
            role='member',
            status='active'
        )

    def test_membership_list(self):
        """Test listing memberships"""
        self.client.force_authenticate(user=self.user)
        url = reverse('group-membership-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

    def test_membership_activation(self):
        """Test membership activation"""
        self.membership.is_active = False
        self.membership.status = 'inactive'
        self.membership.save()
        
        self.client.force_authenticate(user=self.user)
        url = reverse('group-membership-activate', kwargs={'pk': self.membership.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.membership.refresh_from_db()
        self.assertTrue(self.membership.is_active)
        self.assertEqual(self.membership.status, 'active')

    def test_pending_memberships(self):
        """Test getting pending memberships"""
        # Create pending membership
        MemberGroupRelationship.objects.create(
            member=self.member,
            group=Group.objects.create(name='Another Group'),
            status='pending'
        )
        
        self.client.force_authenticate(user=self.user)
        url = reverse('group-membership-pending')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have at least one pending membership
        pending_count = len([
            m for m in response.data['results'] 
            if m['status'] == 'pending'
        ])
        self.assertGreaterEqual(pending_count, 1)

    def test_membership_statistics(self):
        """Test membership statistics"""
        self.client.force_authenticate(user=self.user)
        url = reverse('group-membership-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_memberships', response.data)
        self.assertIn('active_memberships', response.data)
        self.assertIn('role_distribution', response.data)