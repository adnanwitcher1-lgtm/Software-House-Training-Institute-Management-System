from rest_framework import serializers
from .models import ClientQuery


class ClientQuerySerializer(serializers.ModelSerializer):
    assigned_employee_name = serializers.SerializerMethodField()

    class Meta:
        model = ClientQuery
        fields = [
            'id', 'name', 'amount', 'email', 'phone', 'industry',
            'project_name', 'project_due_date', 'project_requirements',
            'deal_amount', 'assigned_employee', 'assigned_employee_name',
            'project_status', 'created_at',
        ]
        read_only_fields = ['created_by']

    def get_assigned_employee_name(self, obj):
        return obj.assigned_employee.full_name if obj.assigned_employee else None
