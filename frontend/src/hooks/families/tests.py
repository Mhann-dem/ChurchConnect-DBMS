# backend/churchconnect/families/tests.py

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from unittest.mock import patch
import uuid

from .models import Family, FamilyRelationship
from members.models import Member
from authentication.models import AdminUser

User = get_user_model()


class FamilyModelTests(TestCase):
    """Test cases for Family model"""

    def setUp(self):
        """Set up test data"""
        self.member = Member.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="1234567890",
            date_of_birth="1980-01-01",
            gender="male"
        )

    def test_family_creation(self):
        """Test creating a family"""
        family = Family.objects.create(
            family_name="Doe Family",
            primary_contact=self.member,
            address="123 Main St"
        )
        
        self.assertEqual(family.family_name, "Doe Family")
        self.assertEqual(family.primary_contact, self.member)
        self.assertEqual(family.address, "123 Main St")
        self.assertIsNotNone(family.id)
        self.assertIsNotNone(family.created_at)
        self.assertIsNotNone(family.updated_at)

    def test_family_string_representation(self):
        """Test family __str__ method"""
        family = Family.objects.create(family_name="Test Family")
        self.assertEqual(str(family), "Test Family")

    def test_family_properties(self):
        """Test family computed properties"""
        family = Family.objects.create(family_name="Test Family")
        
        # Initially empty
        self.assertEqual(family.member_count, 0)
        self.assertEqual(family.children_count, 0)
        self.assertEqual(family.adults_count, 0)

        # Add members
        member2 = Member.objects.create(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            phone="1234567891",
            date_of_birth="1985-01-01",
            gender="female"
        )

        child = Member.objects.create(
            first_name="Junior",
            last_name="Doe",
            email="junior@example.com",
            phone="1234567892",
            date_of_birth="2010-01-01",
            gender="male"
        )

        FamilyRelationship.objects.create(
            family=family,
            member=self.member,
            relationship_type="head"
        )

        FamilyRelationship.objects.create(
            family=family,
            member=member2,
            relationship_type="spouse"
        )

        FamilyRelationship.objects.create(
            family=family,
            member=child,
            relationship_type="child"
        )

        # Check counts
        self.assertEqual(family.member_count, 3)
        self.assertEqual(family.children_count, 1)
        self.assertEqual(family.adults_count, 2)

    def test_family_helper_methods(self):
        """Test family helper methods"""
        family = Family.objects.create(
            family_name="Test Family",
            primary_contact=self.member
        )

        # Test contact info
        contact_info = family.get_contact_info()
        self.assertIsNotNone(contact_info)
        self.assertEqual(contact_info['name'], "John Doe")
        self.assertEqual(contact_info['email'], "john@example.com")

        # Test family summary
        summary = family.get_family_summary()
        self.assertEqual(summary['family_name'], "Test Family")
        self.assertIsNotNone(summary['primary_contact'])


class FamilyRelationshipModelTests(TestCase):
    """Test cases for FamilyRelationship model"""

    def setUp(self):
        """Set up test data"""
        self.family = Family.objects.create(family_name="Test Family")
        self.member = Member.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="1234567890",
            date_of_birth="1980-01-01",
            gender="male"
        )

    def test_relationship_creation(self):
        """Test creating a family relationship"""
        relationship = FamilyRelationship.objects.create(
            family=self.family,
            member=self.member,
            relationship_type="head",
            notes="Head of household"
        )

        self.assertEqual(relationship.family, self.family)
        self.assertEqual(relationship.member, self.member)
        self.assertEqual(relationship.relationship_type, "head")
        self.assertEqual(relationship.notes, "Head of household")

    def test_relationship_string_representation(self):
        """Test relationship __str__ method"""
        relationship = FamilyRelationship.objects.create(
            family=self.family,
            member=self.member,
            relationship_type="head"
        )
        
        expected = "John Doe - Head of Household in Test Family"
        self.assertEqual(str(relationship), expected)

    def test_relationship_type_constraints(self):
        """Test relationship type business rules"""
        # Create head of household
        FamilyRelationship.objects.create(
            family=self.family,
            member=self.member,
            relationship_type="head"
        )

        # Try to create another head of household
        member2 = Member.objects.create(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            phone="1234567891",
            date_of_birth="1985-01-01",
            gender="female"
        )

        with self.assertRaises(ValidationError):
            relationship2 = FamilyRelationship(
                family=self.family,
                member=member2,
                relationship_type="head"
            )
            relationship2.full_clean()

    def test_member_family_id_update(self):
        """Test that member's family_id is updated when relationship is created"""
        relationship = FamilyRelationship.objects.create(
            family=self.family,
            member=self.member,
            relationship_type="head"
        )

        # Refresh member from database
        self.member.refresh_from_db()
        self.assertEqual(self.member.family_id, self.family.id)

    def test_relationship_helper_methods(self):
        """Test relationship helper methods"""
        # Test adult relationship
        relationship = FamilyRelationship.objects.create(
            family=self.family,
            member=self.member,
            relationship_type="head"
        )

        self.assertTrue(relationship.is_adult())
        self.assertFalse(relationship.is_child())
        self.assertEqual(relationship.get_relationship_priority(), 1)

        # Test child relationship
        child = Member.objects.create(
            first_name="Junior",
            last_name="Doe",
            email="junior@example.com",
            phone="1234567892",
            date_of_birth="2010-01-01",
            gender="male"
        )

        child_relationship = FamilyRelationship.objects.create(
            family=self.family,
            member=child,
            relationship_type="child"
        )

        self.assertFalse(child_relationship.is_adult())
        self.assertTrue(child_relationship.is_child())
        self.assertEqual(child_relationship.get_relationship_priority(), 3)


class FamilyAPITests(APITestCase):
    """Test cases for Family API endpoints"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = AdminUser.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass123",
            role="admin"
        )
        
        # Create test members
        self.member1 = Member.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="1234567890",
            date_of_birth="1980-01-01",
            gender="male"
        )
        
        self.member2 = Member.objects.create(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            phone="1234567891",
            date_of_birth="1985-01-01",
            gender="female"
        )

        # Create test family
        self.family = Family.objects.create(
            family_name="Doe Family",
            primary_contact=self.member1,
            address="123 Main St"
        )

        # Authenticate requests
        self.client.force_authenticate(user=self.admin_user)

    def test_list_families(self):
        """Test listing families"""
        url = reverse('families:family-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['family_name'], 'Doe Family')

    def test_create_family(self):
        """Test creating a new family"""
        url = reverse('families:family-list')
        data = {
            'family_name': 'Smith Family',
            'address': '456 Oak Ave',
            'primary_contact_id': self.member2.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['family_name'], 'Smith Family')
        self.assertTrue(Family.objects.filter(family_name='Smith Family').exists())

    def test_retrieve_family(self):
        """Test retrieving a specific family"""
        url = reverse('families:family-detail', kwargs={'pk': self.family.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['family_name'], 'Doe Family')
        self.assertEqual(response.data['primary_contact_name'], 'John Doe')

    def test_update_family(self):
        """Test updating a family"""
        url = reverse('families:family-detail', kwargs={'pk': self.family.id})
        data = {
            'family_name': 'Updated Doe Family',
            'address': '789 Pine St'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['family_name'], 'Updated Doe Family')

    def test_delete_family(self):
        """Test deleting a family"""
        url = reverse('families:family-detail', kwargs={'pk': self.family.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Family.objects.filter(id=self.family.id).exists())

    def test_add_member_to_family(self):
        """Test adding a member to a family"""
        url = reverse('families:family-add-member', kwargs={'pk': self.family.id})
        data = {
            'member_id': self.member2.id,
            'relationship_type': 'spouse',
            'notes': 'Wife'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            FamilyRelationship.objects.filter(
                family=self.family,
                member=self.member2
            ).exists()
        )

    def test_remove_member_from_family(self):
        """Test removing a member from a family"""
        # First add a member
        relationship = FamilyRelationship.objects.create(
            family=self.family,
            member=self.member2,
            relationship_type='spouse'
        )
        
        url = reverse(
            'families:family-remove-member',
            kwargs={'pk': self.family.id, 'member_id': self.member2.id}
        )
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            FamilyRelationship.objects.filter(
                family=self.family,
                member=self.member2
            ).exists()
        )

    def test_get_family_members(self):
        """Test getting all members of a family"""
        # Add a member
        FamilyRelationship.objects.create(
            family=self.family,
            member=self.member1,
            relationship_type='head'
        )
        
        url = reverse('families:family-members', kwargs={'pk': self.family.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['members']), 1)

    def test_family_statistics(self):
        """Test getting family statistics"""
        url = reverse('families:family-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_families', response.data)
        self.assertIn('average_family_size', response.data)

    def test_search_families(self):
        """Test searching families"""
        url = reverse('families:family-list')
        response = self.client.get(url, {'search': 'Doe'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_filter_families(self):
        """Test filtering families"""
        url = reverse('families:family-list')
        response = self.client.get(url, {'has_children': 'false'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthorized_access(self):
        """Test that unauthenticated requests are rejected"""
        self.client.force_authenticate(user=None)
        url = reverse('families:family-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FamilyRelationshipAPITests(APITestCase):
    """Test cases for Family Relationship API endpoints"""

    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = AdminUser.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="testpass123",
            role="admin"
        )
        
        # Create test data
        self.family = Family.objects.create(family_name="Test Family")
        self.member = Member.objects.create(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            phone="1234567890",
            date_of_birth="1980-01-01",
            gender="male"
        )
        
        self.relationship = FamilyRelationship.objects.create(
            family=self.family,
            member=self.member,
            relationship_type="head"
        )

        # Authenticate requests
        self.client.force_authenticate(user=self.admin_user)

    def test_list_relationships(self):
        """Test listing family relationships"""
        url = reverse('families:family-relationship-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_create_relationship(self):
        """Test creating a new family relationship"""
        member2 = Member.objects.create(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            phone="1234567891",
            date_of_birth="1985-01-01",
            gender="female"
        )
        
        url = reverse('families:family-relationship-list')
        data = {
            'family': self.family.id,
            'member_id': member2.id,
            'relationship_type': 'spouse'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_filter_relationships(self):
        """Test filtering relationships"""
        url = reverse('families:family-relationship-list')
        response = self.client.get(url, {'relationship_type': 'head'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)