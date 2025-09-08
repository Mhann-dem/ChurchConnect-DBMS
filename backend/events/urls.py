# backend/churchconnect/events/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventRegistrationViewSet, EventReminderViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'event-registrations', EventRegistrationViewSet)
router.register(r'event-reminders', EventReminderViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
]