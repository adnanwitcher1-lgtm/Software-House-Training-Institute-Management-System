from django.urls import path
from .views import DashboardStatsView, EmployeeDashboardStatsView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('employee-stats/', EmployeeDashboardStatsView.as_view(), name='employee-dashboard-stats'),
]