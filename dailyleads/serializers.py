from rest_framework import serializers
from .models import DailyLead


class DailyLeadSerializer(serializers.ModelSerializer):
    course_name = serializers.SerializerMethodField()

    class Meta:
        model = DailyLead
        fields = [
            'id', 'full_name', 'guardian_name', 'phone', 'guardian_phone',
            'gender', 'address', 'course', 'course_name', 'reference', 'created_at',
        ]
        read_only_fields = ['created_by']

    def get_course_name(self, obj):
        return obj.course.name if obj.course else None
