# ==============================================================================
# pledges/urls.py - COMPLETE FIX
# ==============================================================================
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.PledgeViewSet, basename='pledge')
router.register(r'payments', views.PledgePaymentViewSet, basename='pledge-payment')
router.register(r'reminders', views.PledgeReminderViewSet, basename='pledge-reminder')

# Define URL patterns - CRITICAL: Custom endpoints MUST come BEFORE router URLs
urlpatterns = [
    # Custom endpoints that frontend expects (must be before router URLs)
    path('stats/', views.PledgeViewSet.as_view({'get': 'statistics'}), name='pledge-stats'),
    path('statistics/', views.PledgeViewSet.as_view({'get': 'statistics'}), name='pledge-statistics'),
    path('export/', views.PledgeViewSet.as_view({'get': 'export_csv'}), name='pledge-export'),
    path('summary_report/', views.PledgeViewSet.as_view({'get': 'summary_report'}), name='pledge-summary'),
    path('overdue/', views.PledgeViewSet.as_view({'get': 'overdue'}), name='pledge-overdue'),
    path('upcoming_payments/', views.PledgeViewSet.as_view({'get': 'upcoming_payments'}), name='pledge-upcoming'),
    path('bulk_action/', views.PledgeViewSet.as_view({'post': 'bulk_action'}), name='pledge-bulk-action'),
    
    # Include all router URLs (this will create standard CRUD + other custom actions)
    path('', include(router.urls)),
]

# This configuration creates the following URL patterns:
#
# Custom endpoints (higher priority):
# - GET /api/v1/pledges/stats/              - Pledge statistics (frontend calls this)
# - GET /api/v1/pledges/statistics/         - Alternative stats endpoint
# - GET /api/v1/pledges/export/             - Export pledges to CSV
# - GET /api/v1/pledges/summary_report/     - Member summary report
# - GET /api/v1/pledges/overdue/            - List overdue pledges
# - GET /api/v1/pledges/upcoming_payments/  - List upcoming payments
# - POST /api/v1/pledges/bulk_action/       - Perform bulk actions
#
# Router-generated endpoints:
# - GET/POST     /api/v1/pledges/                    - List/Create pledges
# - GET/PUT/PATCH/DELETE /api/v1/pledges/{id}/       - Retrieve/Update/Delete pledge
# - POST         /api/v1/pledges/{id}/add_payment/   - Add payment to specific pledge
# - GET          /api/v1/pledges/{id}/payment_history/ - Get payment history for pledge
#
# Payments:
# - GET/POST     /api/v1/pledges/payments/           - List/Create payments
# - GET/PUT/PATCH/DELETE /api/v1/pledges/payments/{id}/ - Retrieve/Update/Delete payment
# - GET          /api/v1/pledges/payments/export_csv/ - Export payments to CSV
# - GET          /api/v1/pledges/payments/statistics/ - Payment statistics
#
# Reminders:
# - GET/POST     /api/v1/pledges/reminders/          - List/Create reminders
# - GET/PUT/PATCH/DELETE /api/v1/pledges/reminders/{id}/ - Retrieve/Update/Delete reminder

app_name = 'pledges'