import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0003_alter_course_name"),
        ("dailyqueries", "0002_dailyquery_phone"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="dailyquery",
            name="category",
        ),
        migrations.RemoveField(
            model_name="dailyquery",
            name="email",
        ),
        migrations.RemoveField(
            model_name="dailyquery",
            name="message",
        ),
        migrations.RemoveField(
            model_name="dailyquery",
            name="status",
        ),
        migrations.AddField(
            model_name="dailyquery",
            name="address",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="dailyquery",
            name="course",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to="courses.course",
            ),
        ),
        migrations.AddField(
            model_name="dailyquery",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("male", "Male"), ("female", "Female"), ("other", "Other")],
                default="",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="dailyquery",
            name="guardian_name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="dailyquery",
            name="guardian_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="dailyquery",
            name="reference",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
    ]
