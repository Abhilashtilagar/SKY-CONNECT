"""
URL patterns for the users app.
Mounted at /api/v1/users/ from the root urls.py.
"""

from django.urls import path
from .views import LoginView, RegisterView, AddToActivityView, GetAllActivityView

urlpatterns = [
    path("login", LoginView.as_view()),
    path("register", RegisterView.as_view()),
    path("add_to_activity", AddToActivityView.as_view()),
    path("get_all_activity", GetAllActivityView.as_view()),
]
