from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    has_login = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'designation', 'department', 'phone', 'cnic', 'email',
           'address', 'joining_date', 'status', 'salary', 'assigned_course', 'has_login', 'created_at']

    def get_has_login(self, obj):
        return obj.user_id is not None

class EmployeeCreateLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)


class EmployeeSelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'designation', 'department', 'cnic', 'email',
                   'phone', 'address', 'joining_date', 'status']
        read_only_fields = ['full_name', 'designation', 'department', 'cnic', 'email', 'joining_date', 'status']

class EmployeeSelfSerializer(serializers.ModelSerializer):
    assigned_course_name = serializers.CharField(source='assigned_course.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'designation', 'department', 'cnic', 'email',
                   'phone', 'address', 'joining_date', 'status', 'assigned_course', 'assigned_course_name']
        read_only_fields = ['full_name', 'designation', 'department', 'cnic', 'email', 'joining_date', 'status', 'assigned_course']