from rest_framework import serializers
from django.db.models import Sum
from .models import Fee, Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'fee', 'amount_paid', 'payment_date', 'payment_method', 'received_by', 'notes', 'created_at']
        read_only_fields = ['received_by', 'payment_date']

    def validate(self, data):
        amount = data.get('amount_paid')
        if amount is None or amount <= 0:
            raise serializers.ValidationError({"amount_paid": "Amount must be greater than zero."})

        fee = data.get('fee')
        paid_so_far = fee.payments.aggregate(total=Sum('amount_paid'))['total'] or 0
        remaining = fee.total_fee - paid_so_far

        if amount > remaining:
            raise serializers.ValidationError({"amount_paid": f"Amount exceeds remaining balance of {remaining}."})
        return data


class FeeDetailSerializer(serializers.ModelSerializer):
    paid_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='enrollment.student.full_name', read_only=True)
    course_name = serializers.CharField(source='enrollment.course.name', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Fee
        fields = ['id', 'enrollment', 'student_name', 'course_name', 'total_fee',
                   'paid_amount', 'remaining_amount', 'status', 'payments', 'created_at']

    def get_paid_amount(self, obj):
        return obj.payments.aggregate(total=Sum('amount_paid'))['total'] or 0

    def get_remaining_amount(self, obj):
        return obj.total_fee - self.get_paid_amount(obj)

    def get_status(self, obj):
        paid = self.get_paid_amount(obj)
        if paid == 0:
            return 'unpaid'
        elif paid < obj.total_fee:
            return 'partial'
        return 'paid'