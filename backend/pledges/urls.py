# pledges/urls.py - FINAL CLEAN VERSION
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.PledgeViewSet, basename='pledge')
router.register(r'payments', views.PledgePaymentViewSet, basename='pledge-payment')
router.register(r'reminders', views.PledgeReminderViewSet, basename='pledge-reminder')

app_name = 'pledges'

# Let the router handle ALL URLs - it automatically creates URLs for @action methods
urlpatterns = [
    path('', include(router.urls)),
]

# The router automatically creates these URLs from your ViewSet @action decorators:
#
# Standard CRUD:
# - GET/POST     /api/v1/pledges/                    - list/create
# - GET/PUT/PATCH/DELETE /api/v1/pledges/{id}/       - retrieve/update/delete
#
# Custom actions (from @action decorators in your ViewSet):
# - GET  /api/v1/pledges/statistics/                 - statistics action
# - GET  /api/v1/pledges/recent/                     - recent action
# - GET  /api/v1/pledges/overdue/                    - overdue action
# - GET  /api/v1/pledges/trends/                     - trends action
# - GET  /api/v1/pledges/export_csv/                 - export_csv action
# - GET  /api/v1/pledges/summary_report/             - summary_report action
# - GET  /api/v1/pledges/upcoming_payments/          - upcoming_payments action
# - POST /api/v1/pledges/bulk_action/                - bulk_action action
# - POST /api/v1/pledges/bulk_update/                - bulk_update action
# - POST /api/v1/pledges/bulk_delete/                - bulk_delete action
# - POST /api/v1/pledges/{id}/add_payment/           - add_payment action
# - GET  /api/v1/pledges/{id}/payment_history/       - payment_history action
#
# Payments & Reminders:
# - GET/POST     /api/v1/pledges/payments/           - list/create payments
# - GET/PUT/PATCH/DELETE /api/v1/pledges/payments/{id}/ - payment CRUD
# - GET/POST     /api/v1/pledges/reminders/          - list/create reminders
# - GET/PUT/PATCH/DELETE /api/v1/pledges/reminders/{id}/ - reminder CRUD