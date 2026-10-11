from rest_framework import serializers
from .models import Enrollment
from students.models import Student
from courses.models import Course
from fees.models import Fee


class StudentSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'full_name', 'registration_number', 'email', 'phone', 'guardian_phone', 'address']

class CourseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'fee_amount']

class EnrollmentSerializer(serializers.ModelSerializer):
    student_detail = StudentSummarySerializer(source='student', read_only=True)
    course_detail = CourseSummarySerializer(source='course', read_only=True)
    concession_amount = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True, required=False, default=0)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_detail', 'course', 'course_detail',
            'enrollment_date', 'expected_end_date', 'status', 'internship_status',
            'created_by', 'created_at', 'concession_amount',
        ]
        read_only_fields = ['enrollment_date', 'created_by']

    def validate(self, data):
        course = data.get('course')
        concession = data.get('concession_amount', 0) or 0
        if course and self.instance is None:
            if course.status != 'active':
                raise serializers.ValidationError({"course": "Cannot enroll in an inactive course."})
            if concession > course.fee_amount:
                raise serializers.ValidationError({"concession_amount": "Concession cannot exceed the course fee."})
        return data

    def create(self, validated_data):
        concession = validated_data.pop('concession_amount', 0) or 0
        enrollment = Enrollment.objects.create(**validated_data)
        Fee.objects.create(
            enrollment=enrollment,
            total_fee=enrollment.course.fee_amount - concession,
        )
        return enrollment