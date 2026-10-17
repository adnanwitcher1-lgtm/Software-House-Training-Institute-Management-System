from django.db import models
from django.conf import settings


class Client(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    INDUSTRY_CHOICES = (
        ('it', 'IT'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('retail', 'Retail'),
        ('finance', 'Finance'),
        ('manufacturing', 'Manufacturing'),
        ('other', 'Other'),
    )

    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=150, blank=True, default='')
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    industry = models.CharField('Business Type', max_length=20, choices=INDUSTRY_CHOICES, blank=True)
    project_name = models.CharField(max_length=150, blank=True)
    project_due_date = models.DateField(null=True, blank=True)
    project_requirements = models.TextField(blank=True)
    deal_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    PROJECT_STATUS_CHOICES = (
    ('pending', 'Pending'),
    ('start', 'Start'),
    ('completed', 'Completed'),
    )
    assigned_employee = models.ForeignKey('employees.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    project_status = models.CharField(max_length=10, choices=PROJECT_STATUS_CHOICES, default='pending')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ClientPayment(models.Model):
    METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('bank', 'Bank'),
        ('other', 'Other'),
    )
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    payment_method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='bank')
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.amount_paid} from {self.client.name}"
