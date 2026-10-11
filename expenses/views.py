from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Expense
from .serializers import ExpenseSerializer
from accounts.permissions import IsAdminOrReceptionist


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdminOrReceptionist]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)