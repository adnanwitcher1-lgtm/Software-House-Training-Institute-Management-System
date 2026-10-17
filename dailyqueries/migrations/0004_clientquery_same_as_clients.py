import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("employees", "0005_employeeattendance"),
        ("dailyqueries", "0003_query_enrollment_fields"),
    ]

    operations = [
        # DailyQuery -> ClientQuery (table bhi rename hota hai, purana data bacha rehta hai)
        migrations.RenameModel(old_name="DailyQuery", new_name="ClientQuery"),

        # full_name -> name (purana naam data safe rahega)
        migrations.RenameField(model_name="clientquery", old_name="full_name", new_name="name"),
        migrations.AlterField(
            model_name="clientquery",
            name="name",
            field=models.CharField(max_length=150),
        ),

        # purani student-style fields hata di
        migrations.RemoveField(model_name="clientquery", name="guardian_name"),
        migrations.RemoveField(model_name="clientquery", name="guardian_phone"),
        migrations.RemoveField(model_name="clientquery", name="gender"),
        migrations.RemoveField(model_name="clientquery", name="address"),
        migrations.RemoveField(model_name="clientquery", name="course"),
        migrations.RemoveField(model_name="clientquery", name="reference"),

        # Clients jaisi nayi fields
        migrations.AddField(
            model_name="clientquery",
            name="amount",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="industry",
            field=models.CharField(
                blank=True,
                default="",
                max_length=20,
                verbose_name="Business Type",
                choices=[
                    ("it", "IT"),
                    ("healthcare", "Healthcare"),
                    ("education", "Education"),
                    ("retail", "Retail"),
                    ("finance", "Finance"),
                    ("manufacturing", "Manufacturing"),
                    ("other", "Other"),
                ],
            ),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="project_name",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="project_due_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="project_requirements",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="deal_amount",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="assigned_employee",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="client_queries",
                to="employees.employee",
            ),
        ),
        migrations.AddField(
            model_name="clientquery",
            name="project_status",
            field=models.CharField(
                default="pending",
                max_length=10,
                choices=[
                    ("pending", "Pending"),
                    ("start", "Start"),
                    ("completed", "Completed"),
                ],
            ),
        ),
    ]
