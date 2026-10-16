from rest_framework import serializers
from .models import DailyQuery


class DailyQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyQuery
        fields = ['id', 'full_name', 'email', 'phone', 'message', 'category', 'status', 'created_at']
        read_only_fields = ['created_by']
