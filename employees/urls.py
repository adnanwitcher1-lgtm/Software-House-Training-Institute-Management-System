from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    EmployeeViewSet, EmployeeMeView, RunPayrollView,
    EmployeeAttendanceView, EmployeeAttendanceHistoryView,
)


router = DefaultRouter()
router.register('', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('me/', EmployeeMeView.as_view(), name='employee-me'),
    path('run-payroll/', RunPayrollView.as_view(), name='run-payroll'),
    path('attendance/', EmployeeAttendanceView.as_view(), name='employee-attendance'),
    path('attendance/history/', EmployeeAttendanceHistoryView.as_view(), name='employee-attendance-history'),
] + router.urls
