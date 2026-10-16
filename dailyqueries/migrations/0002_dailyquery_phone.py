from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dailyqueries', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailyquery',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
    ]
