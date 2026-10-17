from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0005_client_assigned_employee_client_project_status"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="client",
            name="business_type",
        ),
        migrations.AlterField(
            model_name="client",
            name="industry",
            field=models.CharField(
                blank=True,
                choices=[
                    ("it", "IT"),
                    ("healthcare", "Healthcare"),
                    ("education", "Education"),
                    ("retail", "Retail"),
                    ("finance", "Finance"),
                    ("manufacturing", "Manufacturing"),
                    ("other", "Other"),
                ],
                max_length=20,
                verbose_name="Business Type",
            ),
        ),
        migrations.AlterField(
            model_name="client",
            name="project_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("start", "Start"),
                    ("completed", "Completed"),
                ],
                default="pending",
                max_length=10,
            ),
        ),
    ]
