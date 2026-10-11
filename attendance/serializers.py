from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    registration_number = serializers.CharField(source='student.registration_number', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_name', 'registration_number', 'course', 'course_name', 'date', 'status', 'marked_by', 'created_at']
        read_only_fields = ['marked_by']


class BulkAttendanceEntrySerializer(serializers.Serializer):
    student = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['present', 'absent'])


class BulkAttendanceMarkSerializer(serializers.Serializer):
    course = serializers.IntegerField()
    date = serializers.DateField()
    entries = BulkAttendanceEntrySerializer(many=True)