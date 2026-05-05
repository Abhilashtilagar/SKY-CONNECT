"""
REST API views for user authentication and meeting history.

Endpoints (mounted at /api/v1/users/):
  POST  /login              – authenticate user, return token
  POST  /register           – create new user account
  POST  /add_to_activity    – save a meeting code to history
  GET   /get_all_activity   – retrieve meeting history for a token
"""

import bcrypt
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

from .models import AppUser, Meeting


def _parse_body(request):
    """Return parsed JSON body or empty dict."""
    try:
        return json.loads(request.body or "{}")
    except (json.JSONDecodeError, ValueError):
        return {}


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        data = _parse_body(request)
        username = (data.get("username") or "").strip()
        password = (data.get("password") or "").strip()

        if not username or not password:
            return JsonResponse({"message": "Please provide username and password"}, status=400)

        try:
            user = AppUser.objects.get(username=username)
        except AppUser.DoesNotExist:
            return JsonResponse({"message": "User Not Found"}, status=404)

        if bcrypt.checkpw(password.encode(), user.password.encode()):
            token = user.generate_token()
            return JsonResponse({"token": token}, status=200)

        return JsonResponse({"message": "Invalid username or password"}, status=401)


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(View):
    def post(self, request):
        data = _parse_body(request)
        name = (data.get("name") or "").strip()
        username = (data.get("username") or "").strip()
        password = (data.get("password") or "").strip()

        if not name or not username or not password:
            return JsonResponse({"message": "Please provide name, username and password"}, status=400)

        if AppUser.objects.filter(username=username).exists():
            return JsonResponse({"message": "User already exists"}, status=302)

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        AppUser.objects.create(name=name, username=username, password=hashed)
        return JsonResponse({"message": "User Registered"}, status=201)


@method_decorator(csrf_exempt, name="dispatch")
class AddToActivityView(View):
    def post(self, request):
        data = _parse_body(request)
        token = (data.get("token") or "").strip()
        meeting_code = (data.get("meeting_code") or "").strip()

        if not token or not meeting_code:
            return JsonResponse({"message": "token and meeting_code are required"}, status=400)

        try:
            user = AppUser.objects.get(token=token)
        except AppUser.DoesNotExist:
            return JsonResponse({"message": "Invalid token"}, status=401)

        Meeting.objects.create(user_id=user.username, meeting_code=meeting_code)
        return JsonResponse({"message": "Added code to history"}, status=201)


@method_decorator(csrf_exempt, name="dispatch")
class GetAllActivityView(View):
    def get(self, request):
        token = request.GET.get("token", "").strip()

        if not token:
            return JsonResponse({"message": "token is required"}, status=400)

        try:
            user = AppUser.objects.get(token=token)
        except AppUser.DoesNotExist:
            return JsonResponse({"message": "Invalid token"}, status=401)

        meetings = Meeting.objects.filter(user_id=user.username).order_by("-date")
        data = [
            {
                "id": m.id,
                "user_id": m.user_id,
                "meetingCode": m.meeting_code,
                "date": m.date.isoformat(),
            }
            for m in meetings
        ]
        return JsonResponse(data, safe=False, status=200)
