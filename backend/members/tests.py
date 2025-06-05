from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Member
from authentication.models import User

class MemberTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testadmin',
            password='testpass123',
            role='admin'
        )
        self.client.force_authenticate(user=self.user)
        
        self.member_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone': '1234567890',
            'date_of_birth': '1990-01-01',
            'gender': 'male',
        }

    def test_create_member(self):
        url = reverse('member-list')
        response = self.client.post(url, self.member_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Member.objects.count(), 1)
        self.assertEqual(Member.objects.get().first_name, 'John')

    def test_get_members(self):
        Member.objects.create(created_by=self.user, **self.member_data)
        url = reverse('member-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)