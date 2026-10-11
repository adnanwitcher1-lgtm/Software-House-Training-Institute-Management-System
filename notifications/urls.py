from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import NotificationViewSet, CheckAttendanceAlertsView

router = DefaultRouter()
router.register('', NotificationViewSet, basename='notification')

urlpatterns = [
    path('check-attendance-alerts/', CheckAttendanceAlertsView.as_view(), name='check-attendance-alerts'),
] + router.urls