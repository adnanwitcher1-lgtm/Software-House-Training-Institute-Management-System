from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import AttendanceViewSet, BulkMarkAttendanceView

router = DefaultRouter()
router.register('', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('mark/', BulkMarkAttendanceView.as_view(), name='attendance-mark'),
] + router.urls