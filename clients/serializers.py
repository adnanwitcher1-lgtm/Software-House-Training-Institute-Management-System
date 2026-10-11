from rest_framework import serializers
from django.db.models import Sum
from .models import Client, ClientPayment


class ClientPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientPayment
        fields = ['id', 'client', 'amount_paid', 'payment_date', 'payment_method', 'notes', 'created_at']
        read_only_fields = ['payment_date', 'received_by']


class ClientSerializer(serializers.ModelSerializer):
    paid_amount = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
    'id', 'name', 'contact_person', 'email', 'phone', 'industry',
    'business_type', 'project_name', 'project_due_date',
    'project_requirements', 'deal_amount', 'assigned_employee', 'project_status',
    'status', 'paid_amount', 'created_at',
]
        read_only_fields = ['created_by']
        extra_kwargs = {
            'contact_person': {'required': False},
        }
    def get_paid_amount(self, obj):
        return obj.payments.aggregate(total=Sum('amount_paid'))['total'] or 0


class EmployeeProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_person', 'email', 'phone',
            'project_name', 'project_due_date', 'project_requirements',
            'deal_amount', 'project_status',
        ]