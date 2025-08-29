#!/usr/bin/env python
"""
Debug script to diagnose authentication and permission issues.
Run this from your Django project root: python debug_authentication.py
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'churchconnect.settings')
django.setup()

def check_database_connection():
    """Check if database connection works"""
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✓ Database connection working")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_users():
    """Check if there are any users in the database"""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users = User.objects.all()
        print(f"✓ Found {users.count()} users in database")
        
        for user in users:
            print(f"  - {user.email} (username: {user.username})")
            print(f"    Authenticated attrs: is_staff={user.is_staff}, is_superuser={user.is_superuser}")
            if hasattr(user, 'role'):
                print(f"    Role: {user.role}")
            if hasattr(user, 'active'):
                print(f"    Active: {user.active}")
            print()
        
        return users.count() > 0
    except Exception as e:
        print(f"✗ Error checking users: {e}")
        return False

def check_rest_framework_settings():
    """Check REST framework configuration"""
    print("REST Framework Settings:")
    try:
        rf_settings = getattr(settings, 'REST_FRAMEWORK', {})
        
        print(f"  DEFAULT_AUTHENTICATION_CLASSES: {rf_settings.get('DEFAULT_AUTHENTICATION_CLASSES', 'Not set')}")
        print(f"  DEFAULT_PERMISSION_CLASSES: {rf_settings.get('DEFAULT_PERMISSION_CLASSES', 'Not set')}")
        
        # Check JWT settings
        jwt_settings = getattr(settings, 'SIMPLE_JWT', {})
        if jwt_settings:
            print(f"  JWT configured: Yes")
            print(f"  ACCESS_TOKEN_LIFETIME: {jwt_settings.get('ACCESS_TOKEN_LIFETIME', 'Not set')}")
        else:
            print(f"  JWT configured: No")
            
        return True
    except Exception as e:
        print(f"✗ Error checking settings: {e}")
        return False

def create_test_user():
    """Create a test user for debugging"""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if test user already exists
        test_email = "test@debug.com"
        if User.objects.filter(email=test_email).exists():
            print(f"✓ Test user {test_email} already exists")
            return True
        
        # Create test user
        user_data = {
            'email': test_email,
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True,
        }
        
        # Add role if the model supports it
        if hasattr(User, 'role'):
            user_data['role'] = 'super_admin'
        if hasattr(User, 'active'):
            user_data['active'] = True
            
        user = User.objects.create_user(**user_data)
        user.set_password('testpassword123')
        user.save()
        
        print(f"✓ Created test user: {test_email} / testpassword123")
        return True
        
    except Exception as e:
        print(f"✗ Error creating test user: {e}")
        return False

def test_authentication():
    """Test authentication with the test user"""
    try:
        from django.contrib.auth import authenticate
        
        user = authenticate(username='test@debug.com', password='testpassword123')
        if user:
            print(f"✓ Authentication working for test user")
            print(f"  User: {user.email}")
            print(f"  Is authenticated: {user.is_authenticated}")
            print(f"  Is active: {user.is_active}")
            return True
        else:
            print(f"✗ Authentication failed for test user")
            return False
            
    except Exception as e:
        print(f"✗ Error testing authentication: {e}")
        return False

def check_member_model():
    """Check if Member model exists and works"""
    try:
        from members.models import Member
        
        count = Member.objects.count()
        print(f"✓ Member model working, found {count} members")
        return True
        
    except Exception as e:
        print(f"✗ Error with Member model: {e}")
        return False

def main():
    print("ChurchConnect Authentication Debug Script")
    print("=" * 50)
    
    checks = [
        ("Database Connection", check_database_connection),
        ("Users in Database", check_users),
        ("REST Framework Settings", check_rest_framework_settings),
        ("Member Model", check_member_model),
        ("Create Test User", create_test_user),
        ("Test Authentication", test_authentication),
    ]
    
    results = {}
    for name, check_func in checks:
        print(f"\n{name}:")
        results[name] = check_func()
    
    print("\n" + "=" * 50)
    print("Summary:")
    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{name}: {status}")
    
    if all(results.values()):
        print("\nAll checks passed! Your setup looks good.")
        print("\nNext steps:")
        print("1. Test the debug endpoint: GET http://127.0.0.1:8000/api/v1/members/debug-auth/")
        print("2. Try logging in with: test@debug.com / testpassword123")
        print("3. Test the members endpoint with authentication")
    else:
        print("\nSome checks failed. Address the failing items above.")
        
    print("\nQuick API Tests:")
    print("1. Test public endpoint: curl -X POST http://127.0.0.1:8000/api/v1/members/members/ -H 'Content-Type: application/json' -d '{}'")
    print("2. Test debug endpoint: curl http://127.0.0.1:8000/api/v1/members/debug-auth/")
    print("3. Login endpoint: curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ -H 'Content-Type: application/json' -d '{\"email\":\"test@debug.com\",\"password\":\"testpassword123\"}'")

if __name__ == '__main__':
    main()