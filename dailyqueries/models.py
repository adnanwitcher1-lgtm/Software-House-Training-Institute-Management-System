from django.db import models
from django.conf import settings


class ClientQuery(models.Model):
    INDUSTRY_CHOICES = (
        ('it', 'IT'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('retail', 'Retail'),
        ('finance', 'Finance'),
        ('manufacturing', 'Manufacturing'),
        ('other', 'Other'),
    )
    PROJECT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('start', 'Start'),
        ('completed', 'Completed'),
    )

    name = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    industry = models.CharField('Business Type', max_length=20, choices=INDUSTRY_CHOICES, blank=True, default='')
    project_name = models.CharField(max_length=150, blank=True, default='')
    project_due_date = models.DateField(null=True, blank=True)
    project_requirements = models.TextField(blank=True, default='')
    deal_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    assigned_employee = models.ForeignKey(
        'employees.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='client_queries'
    )
    project_status = models.CharField(max_length=10, choices=PROJECT_STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.project_name or 'no project'}"
