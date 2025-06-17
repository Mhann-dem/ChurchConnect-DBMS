# ================================================================

# File: backend/core/serializers.py
from rest_framework import serializers

class HealthCheckSerializer(serializers.Serializer):
    """Serializer for health check response."""
    status = serializers.CharField()
    timestamp = serializers.DateTimeField()
    database = serializers.CharField()
    version = serializers.CharField()

class SystemStatusSerializer(serializers.Serializer):
    """Serializer for system status response."""
    status = serializers.CharField()
    timestamp = serializers.DateTimeField()
    system = serializers.DictField()
    database = serializers.DictField()
    statistics = serializers.DictField()
    church_info = serializers.DictField()

class ApiVersionSerializer(serializers.Serializer):
    """Serializer for API version response."""
    api_version = serializers.CharField()
    api_name = serializers.CharField()
    documentation_url = serializers.CharField()
    endpoints = serializers.DictField()
