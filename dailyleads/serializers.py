from rest_framework import serializers
from .models import DailyLead


class DailyLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLead
        fields = ['id', 'full_name', 'work_email', 'company_name', 'job_title', 'phone', 'estimated_budget', 'interested_in', 'created_at']
        read_only_fields = ['created_by']