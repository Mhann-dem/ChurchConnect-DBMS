# ==============================================================================
# pledges/urls.py
# ==============================================================================
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PledgeViewSet, PledgePaymentViewSet

app_name = 'pledges'

router = DefaultRouter()
router.register(r'pledges', PledgeViewSet)
router.register(r'payments', PledgePaymentViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]

