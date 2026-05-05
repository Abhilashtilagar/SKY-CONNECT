from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="AppUser",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150)),
                ("username", models.CharField(max_length=150, unique=True)),
                ("password", models.CharField(max_length=255)),
                ("token", models.CharField(blank=True, default="", max_length=255)),
            ],
            options={"db_table": "app_user"},
        ),
        migrations.CreateModel(
            name="Meeting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.CharField(max_length=150)),
                ("meeting_code", models.CharField(max_length=255)),
                ("date", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "meeting"},
        ),
    ]
