from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PledgeViewSet

router = DefaultRouter()
router.register(r'pledges', PledgeViewSet, basename='pledge')

urlpatterns = [
    path('', include(router.urls)),
]