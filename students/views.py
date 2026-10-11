from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db.models import Q
from .models import Student
from .serializers import StudentListSerializer, StudentDetailSerializer
from accounts.permissions import IsAdmin, IsAdminOrReceptionist


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentDetailSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAdmin()]
        return [IsAdminOrReceptionist()]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')

        if search:
            qs = qs.filter(
                Q(full_name__icontains=search) |
                Q(registration_number__icontains=search) |
                Q(phone__icontains=search)
            )
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # Admin only reaches here (enforced by get_permissions);
        # Receptionist should use PATCH to set status='inactive' instead.
        return super().destroy(request, *args, **kwargs)