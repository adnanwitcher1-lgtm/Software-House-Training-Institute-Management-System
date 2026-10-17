from django.db import models
from django.conf import settings


class Enrollment(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    INTERNSHIP_STATUS_CHOICES = (
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )

    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='enrollments')
    enrollment_date = models.DateField(auto_now_add=True)
    expected_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    internship_status = models.CharField(max_length=15, choices=INTERNSHIP_STATUS_CHOICES, default='not_started')
    reference = models.CharField(max_length=150, blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.full_name} → {self.course.name}"


from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model


@receiver(post_save, sender=Enrollment)
def notify_on_new_enrollment(sender, instance, created, **kwargs):
    if not created:
        return
    from notifications.models import Notification
    User = get_user_model()
    staff = User.objects.filter(role__in=['admin', 'receptionist' , 'employee'])
    for user in staff:
        Notification.objects.create(
            title="New enrollment",
            message=f"{instance.student.full_name} enrolled in {instance.course.name}.",
            notif_type='enrollment',
            recipient=user,
        )
