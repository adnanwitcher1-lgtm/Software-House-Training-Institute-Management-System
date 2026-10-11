from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ('fee_due', 'Fee Due'),
        ('enrollment', 'Enrollment'),
        ('attendance', 'Attendance'),
        ('enrollment_ending', 'Enrollment Ending'),
        ('course', 'Course'),
        ('general', 'General'),
        ('system', 'System'),
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    notif_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.recipient.username}"