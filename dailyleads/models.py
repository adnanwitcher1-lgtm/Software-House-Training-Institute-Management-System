from django.db import models
from django.conf import settings


class DailyLead(models.Model):
    full_name = models.CharField(max_length=100)
    work_email = models.EmailField()
    company_name = models.CharField(max_length=150)
    job_title = models.CharField(max_length=100)
    phone = models.CharField(max_length=11)
    estimated_budget = models.CharField(max_length=100)
    interested_in = models.CharField(max_length=150)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} - {self.company_name}"