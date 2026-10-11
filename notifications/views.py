from django.shortcuts import render

# Create your views here.
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Notification
from .serializers import NotificationSerializer
from accounts.permissions import IsAdmin
from enrollments.models import Enrollment
from attendance.models import Attendance

User = get_user_model()


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)


class CheckAttendanceAlertsView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        staff_users = User.objects.filter(role__in=['admin', 'receptionist' , 'employee'])
        today = date.today()
        created_count = 0

        for enr in Enrollment.objects.filter(status='active'):
            records = Attendance.objects.filter(student=enr.student, course=enr.course)
            total = records.count()
            if total == 0:
                continue

            present = records.filter(status='present').count()
            percentage = round((present / total) * 100)

            if percentage < enr.course.minimum_attendance_percentage:
                title = f"Low attendance: {enr.student.full_name}"
                already_exists = Notification.objects.filter(title=title, created_at__date=today).exists()
                if not already_exists:
                    message = (
                        f"{enr.student.full_name}'s attendance in {enr.course.name} "
                        f"is {percentage}% (minimum required: {enr.course.minimum_attendance_percentage}%)."
                    )
                    for user in staff_users:
                        Notification.objects.create(
                            title=title, message=message, notif_type='attendance', recipient=user
                        )
                    created_count += 1

            if enr.expected_end_date and enr.expected_end_date <= today + timedelta(days=7):
                title = f"Enrollment ending soon: {enr.student.full_name}"
                already_exists = Notification.objects.filter(title=title, created_at__date=today).exists()
                if not already_exists:
                    message = f"{enr.student.full_name}'s enrollment in {enr.course.name} ends on {enr.expected_end_date}."
                    for user in staff_users:
                        Notification.objects.create(
                            title=title, message=message, notif_type='enrollment_ending', recipient=user
                        )
                    created_count += 1

        return Response({"detail": f"Check complete. {created_count} new alert group(s) created."})
