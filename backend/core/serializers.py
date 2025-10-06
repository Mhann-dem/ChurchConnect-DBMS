# core/serializers.py - UPDATED VERSION
from rest_framework import serializers

class HealthCheckSerializer(serializers.Serializer):
    """Serializer for health check response."""
    status = serializers.CharField()
    timestamp = serializers.DateTimeField()
    database = serializers.DictField()
    version = serializers.CharField()
    environment = serializers.CharField()
    service = serializers.CharField()

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
    health_check_url = serializers.CharField()
    system_status_url = serializers.CharField()
    endpoints = serializers.DictField()

class DashboardOverviewSerializer(serializers.Serializer):
    """Serializer for dashboard overview response."""
    summary = serializers.DictField()
    completion_rate = serializers.FloatField()
    last_updated = serializers.DateTimeField()
    status = serializers.CharField()

class DashboardHealthSerializer(serializers.Serializer):
    """Serializer for dashboard health response."""
    status = serializers.CharField()
    timestamp = serializers.DateTimeField()
    checks = serializers.DictField()
    summary = serializers.DictField()
    version = serializers.CharField()
    environment = serializers.CharField()

class DashboardAlertsSerializer(serializers.Serializer):
    """Serializer for dashboard alerts response."""
    results = serializers.ListField()
    count = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    last_updated = serializers.DateTimeField()
    summary = serializers.DictField()

class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard stats response."""
    timestamp = serializers.DateTimeField()
    members = serializers.DictField()
    pledges = serializers.DictField()
    groups = serializers.DictField()
    events = serializers.DictField()
    system = serializers.DictField()