from rest_framework import serializers
from .models import Course, Internship


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = ['id', 'duration_weeks', 'description', 'is_mandatory']


class CourseSerializer(serializers.ModelSerializer):
    internship = InternshipSerializer(read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'duration_weeks', 'fee_amount', 'status', 'internship']