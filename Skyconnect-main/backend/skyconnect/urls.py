"""
URL configuration for skyconnect project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def index(request):
    return JsonResponse({"message": "SkyConnect Backend API is running!"})


urlpatterns = [
    path("", index),
    path("admin/", admin.site.urls),
    path("api/v1/users/", include("users.urls")),
]
