from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("enrollments", "0002_enrollment_expected_end_date"),
    ]

    operations = [
        migrations.AddField(
            model_name="enrollment",
            name="reference",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
    ]
