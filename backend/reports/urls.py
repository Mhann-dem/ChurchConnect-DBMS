from django.urls import path
from .views import ReportView

urlpatterns = [
    path('reports/<str:report_type>/', ReportView.as_view(), name='report'),
]