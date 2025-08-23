# ==============================================================================
# pledges/urls.py
# ==============================================================================
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.PledgeViewSet, basename='pledge')
router.register(r'payments', views.PledgePaymentViewSet, basename='pledge-payment')
router.register(r'reminders', views.PledgeReminderViewSet, basename='pledge-reminder')

# Define URL patterns
urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
    
    # Additional custom endpoints (if needed in the future)
    # path('custom-endpoint/', views.custom_view, name='pledge-custom'),
]

# This configuration creates the following URL patterns:
#
# Pledges:
# - GET/POST     /api/v1/pledges/                    - List/Create pledges
# - GET/PUT/PATCH/DELETE /api/v1/pledges/{id}/       - Retrieve/Update/Delete pledge
# - GET          /api/v1/pledges/statistics/         - Pledge statistics
# - GET          /api/v1/pledges/export_csv/         - Export pledges to CSV
# - GET          /api/v1/pledges/summary_report/     - Member summary report
# - POST         /api/v1/pledges/{id}/add_payment/   - Add payment to specific pledge
# - GET          /api/v1/pledges/overdue/            - List overdue pledges
# - GET          /api/v1/pledges/upcoming_payments/  - List pledges with upcoming payments
# - POST         /api/v1/pledges/bulk_action/        - Perform bulk actions
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