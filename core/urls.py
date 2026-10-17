from django.contrib import admin
from django.urls import path, include
from accounts.views import ReceptionistCreateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/accounts/receptionists/', ReceptionistCreateView.as_view(), name='receptionist-create'),
    path('api/courses/', include('courses.urls')),
    path('api/students/', include('students.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/enrollments/', include('enrollments.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/fees/', include('fees.urls')),
    path('api/clients/', include('clients.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/announcements/', include('announcements.urls')),
    path('api/client-queries/', include('dailyqueries.urls')),
    path('api/daily-leads/', include('dailyleads.urls')),
    path('api/expenses/', include('expenses.urls')),
    path('api/dashboard/', include('dashboard.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
