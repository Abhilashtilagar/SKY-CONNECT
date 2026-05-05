"""
User and Meeting models backed by SQL (SQLite by default).
"""

from django.db import models
import secrets


class AppUser(models.Model):
    """Application user – stores credentials and auth token."""

    name = models.CharField(max_length=150)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)  # bcrypt hash
    token = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "app_user"

    def __str__(self):
        return self.username

    def generate_token(self):
        self.token = secrets.token_hex(20)
        self.save(update_fields=["token"])
        return self.token


class Meeting(models.Model):
    """A meeting joined/created by a user."""

    user = models.ForeignKey(
        AppUser,
        on_delete=models.CASCADE,
        related_name="meetings",
        db_column="user_id",
    )
    meeting_code = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "meeting"

    def __str__(self):
        return f"{self.user.username} – {self.meeting_code}"
