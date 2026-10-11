from django.db import models
from django.conf import settings


class Fee(models.Model):
    enrollment = models.OneToOneField('enrollments.Enrollment', on_delete=models.CASCADE, related_name='fee')
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Fee for {self.enrollment}"


class Payment(models.Model):
    METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('bank', 'Bank'),
        ('other', 'Other'),
    )
    fee = models.ForeignKey(Fee, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    payment_method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='cash')
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount_paid} for {self.fee}"