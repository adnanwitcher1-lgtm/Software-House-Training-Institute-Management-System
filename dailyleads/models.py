from django.db import models
from django.conf import settings


class DailyLead(models.Model):
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    full_name = models.CharField(max_length=100)
    guardian_name = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    guardian_phone = models.CharField(max_length=20, blank=True, default='')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, default='')
    address = models.TextField(blank=True, default='')
    course = models.ForeignKey('courses.Course', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    reference = models.CharField(max_length=150, blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} - {self.reference or 'no reference'}"
