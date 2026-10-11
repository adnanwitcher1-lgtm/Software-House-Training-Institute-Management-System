from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Fee, Payment
from .serializers import FeeDetailSerializer, PaymentSerializer
from accounts.permissions import IsAdmin, IsAdminOrReceptionist


class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all().order_by('-created_at')
    serializer_class = FeeDetailSerializer
    http_method_names = ['get', 'patch', 'head', 'options']  # no create/delete — Fee is auto-created

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrReceptionist()]
        return [IsAdmin()]  # only Admin can edit total_fee


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrReceptionist]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        fee_id = self.request.query_params.get('fee')
        if fee_id:
            qs = qs.filter(fee_id=fee_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)