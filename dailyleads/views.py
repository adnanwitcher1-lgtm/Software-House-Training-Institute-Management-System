from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import DailyLead
from .serializers import DailyLeadSerializer
from accounts.permissions import IsAdminOrReceptionist


class DailyLeadViewSet(viewsets.ModelViewSet):
    queryset = DailyLead.objects.all()
    serializer_class = DailyLeadSerializer
    permission_classes = [IsAdminOrReceptionist]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)