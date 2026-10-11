from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Announcement
from .serializers import AnnouncementSerializer
from accounts.permissions import IsAdmin


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return []
        return [IsAdmin()]

    def get_queryset(self):
        qs = Announcement.objects.all()
        if self.request.user.role != 'admin':
            qs = qs.filter(status='published')
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)