from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Enrollment
from .serializers import EnrollmentSerializer
from accounts.permissions import IsAdmin, IsAdminOrReceptionist, IsAdminOrReceptionistOrEmployee

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().order_by('-created_at')
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action == 'destroy':
           return [IsAdmin()]
        if self.action in ['list', 'retrieve']:
           return [IsAdminOrReceptionistOrEmployee()]
        return [IsAdminOrReceptionist()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student')
        course_id = self.request.query_params.get('course')

        if self.request.user.role == 'employee':
            employee = getattr(self.request.user, 'employee', None)
            if employee and employee.assigned_course_id:
                qs = qs.filter(course_id=employee.assigned_course_id)
            else:
                qs = qs.none()

        if student_id:
            qs = qs.filter(student_id=student_id)
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs