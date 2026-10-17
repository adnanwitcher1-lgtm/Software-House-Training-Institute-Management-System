import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0003_alter_course_name"),
        ("dailyleads", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="dailylead",
            name="company_name",
        ),
        migrations.RemoveField(
            model_name="dailylead",
            name="estimated_budget",
        ),
        migrations.RemoveField(
            model_name="dailylead",
            name="interested_in",
        ),
        migrations.RemoveField(
            model_name="dailylead",
            name="job_title",
        ),
        migrations.RemoveField(
            model_name="dailylead",
            name="work_email",
        ),
        migrations.AddField(
            model_name="dailylead",
            name="address",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="dailylead",
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
            model_name="dailylead",
            name="gender",
            field=models.CharField(
                blank=True,
                choices=[("male", "Male"), ("female", "Female"), ("other", "Other")],
                default="",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="dailylead",
            name="guardian_name",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="dailylead",
            name="guardian_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="dailylead",
            name="reference",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AlterField(
            model_name="dailylead",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
