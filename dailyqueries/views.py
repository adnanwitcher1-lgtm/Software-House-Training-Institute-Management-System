from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import DailyQuery
from .serializers import DailyQuerySerializer
from accounts.permissions import IsAdminOrReceptionist


class DailyQueryViewSet(viewsets.ModelViewSet):
    queryset = DailyQuery.objects.all()
    serializer_class = DailyQuerySerializer
    permission_classes = [IsAdminOrReceptionist]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)