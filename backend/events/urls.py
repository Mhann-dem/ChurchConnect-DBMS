# events/urls.py - CLEAN Events URLs for ChurchConnect
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet, EventRegistrationViewSet, EventReminderViewSet,
    EventCategoryViewSet, EventVolunteerViewSet
)

app_name = 'events'

# Create router and register viewsets
router = DefaultRouter()

router.register(r'events', EventViewSet, basename='event')
router.register(r'registrations', EventRegistrationViewSet, basename='event-registration')
router.register(r'reminders', EventReminderViewSet, basename='event-reminder')
router.register(r'categories', EventCategoryViewSet, basename='event-category')
router.register(r'volunteers', EventVolunteerViewSet, basename='event-volunteer')

urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
]

# URL Structure:
#
# Events:
# GET/POST     /api/v1/events/events/                     - List/Create events
# GET/PUT/PATCH/DELETE /api/v1/events/events/{id}/        - Retrieve/Update/Delete event
# GET          /api/v1/events/events/calendar/            - Calendar view of events
# GET          /api/v1/events/events/upcoming/            - Upcoming events
# GET          /api/v1/events/events/statistics/          - Event statistics
# GET          /api/v1/events/events/export/              - Export events to CSV
# POST         /api/v1/events/events/bulk_action/         - Bulk actions on events
# POST         /api/v1/events/events/{id}/register/       - Register for specific event
# GET          /api/v1/events/events/{id}/registrations/  - Get event registrations
# GET          /api/v1/events/events/{id}/volunteers/     - Get event volunteers
# POST         /api/v1/events/events/{id}/duplicate/      - Duplicate event
#
# Event Registrations:
# GET/POST     /api/v1/events/registrations/              - List/Create registrations
# GET/PUT/PATCH/DELETE /api/v1/events/registrations/{id}/ - Retrieve/Update/Delete registration
# POST         /api/v1/events/registrations/{id}/confirm/ - Confirm registration
# POST         /api/v1/events/registrations/{id}/cancel/  - Cancel registration
# POST         /api/v1/events/registrations/{id}/mark_attended/ - Mark as attended
# GET          /api/v1/events/registrations/export/       - Export registrations to CSV
#
# Event Reminders:
# GET/POST     /api/v1/events/reminders/                  - List/Create reminders
# GET/PUT/PATCH/DELETE /api/v1/events/reminders/{id}/     - Retrieve/Update/Delete reminder
#
# Event Categories:
# GET/POST     /api/v1/events/categories/                 - List/Create categories
# GET/PUT/PATCH/DELETE /api/v1/events/categories/{id}/    - Retrieve/Update/Delete category
#
# Event Volunteers:
# GET/POST     /api/v1/events/volunteers/                 - List/Create volunteer assignments
# GET/PUT/PATCH/DELETE /api/v1/events/volunteers/{id}/    - Retrieve/Update/Delete volunteer assignment