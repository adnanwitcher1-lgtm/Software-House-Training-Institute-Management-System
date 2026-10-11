from rest_framework import serializers
from .models import Student


class StudentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'registration_number', 'phone', 'status', 'email', 'guardian_phone', 'address']

class StudentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'full_name', 'gender', 'date_of_birth', 'phone', 'email',
            'address', 'guardian_name', 'guardian_phone', 'registration_number',
            'registration_date', 'status', 'photo', 'created_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['registration_number', 'registration_date', 'created_by']