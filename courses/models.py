from django.db import models

class Course(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    duration_weeks = models.PositiveIntegerField()
    fee_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    minimum_attendance_percentage = models.PositiveIntegerField(default=75)

    def __str__(self):
        return self.name


class Internship(models.Model):
    course = models.OneToOneField(Course, on_delete=models.CASCADE, related_name='internship')
    duration_weeks = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    is_mandatory = models.BooleanField(default=True)

    def __str__(self):
        return f"Internship - {self.course.name}"