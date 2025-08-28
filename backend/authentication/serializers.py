from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import AdminUser, PasswordResetToken


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )

            if not user:
                raise serializers.ValidationError(
                    'Invalid email or password.',
                    code='authorization'
                )

            if not user.active:
                raise serializers.ValidationError(
                    'User account is disabled.',
                    code='authorization'
                )

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password".',
                code='authorization'
            )


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    confirm_password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'active', 'last_login', 'created_at', 'updated_at',
            'full_name', 'password', 'confirm_password'
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at']

    def validate_email(self, value):
        """Validate email uniqueness"""
        if self.instance:
            # Update case - exclude current instance from uniqueness check
            if AdminUser.objects.filter(email=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        else:
            # Create case - check if email already exists
            if AdminUser.objects.filter(email=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        """Validate username uniqueness"""
        if self.instance:
            # Update case - exclude current instance from uniqueness check
            if AdminUser.objects.filter(username=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A user with this username already exists.")
        else:
            # Create case - check if username already exists
            if AdminUser.objects.filter(username=value).exists():
                raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_password(self, value):
        if value:
            try:
                validate_password(value)
            except ValidationError as e:
                raise serializers.ValidationError(e.messages)
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        if password or confirm_password:
            if not password:
                raise serializers.ValidationError({
                    'password': 'Password is required when confirm_password is provided.'
                })
            if not confirm_password:
                raise serializers.ValidationError({
                    'confirm_password': 'Password confirmation is required.'
                })
            if password != confirm_password:
                raise serializers.ValidationError({
                    'confirm_password': 'Passwords do not match.'
                })

        # Remove confirm_password from attrs as it's not a model field
        attrs.pop('confirm_password', None)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        # Set default values for Django user fields
        validated_data.setdefault('is_staff', True)
        validated_data.setdefault('is_active', validated_data.get('active', True))
        
        user = AdminUser.objects.create_user(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Sync active with is_active
        if 'active' in validated_data:
            instance.is_active = validated_data['active']
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class AdminUserListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'role_display',
            'active', 'last_login', 'created_at'
        ]


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context['request'].user)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.'
            })
        
        # Check that new password is different from current
        user = self.context['request'].user
        if user.check_password(attrs['new_password']):
            raise serializers.ValidationError({
                'new_password': 'New password must be different from current password.'
            })
        
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.updated_at = timezone.now()
        user.save(update_fields=['password', 'updated_at'])
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # For security, don't reveal if email exists or not
        # Just validate format and let the view handle existence check
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_token(self, value):
        try:
            reset_token = PasswordResetToken.objects.get(
                token=value,
                used=False
            )
            if reset_token.is_expired():
                raise serializers.ValidationError('Reset token has expired.')
            
            self.reset_token = reset_token
            return value
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Invalid or expired reset token.')

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs

    def save(self):
        user = self.reset_token.user
        user.set_password(self.validated_data['new_password'])
        user.updated_at = timezone.now()
        user.save(update_fields=['password', 'updated_at'])
        
        # Mark token as used
        self.reset_token.used = True
        self.reset_token.save(update_fields=['used'])
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = AdminUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'role', 'last_login', 'created_at', 'updated_at']

    def validate_email(self, value):
        """Validate email uniqueness for profile updates"""
        if self.instance and AdminUser.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value