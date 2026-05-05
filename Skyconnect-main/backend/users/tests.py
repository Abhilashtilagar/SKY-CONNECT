"""
Tests for the users REST API endpoints.
Run with: python manage.py test users
"""

import json
from django.test import TestCase, Client
from users.models import AppUser, Meeting
import bcrypt


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = "/api/v1/users/register"

    def test_register_success(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"name": "Alice", "username": "alice", "password": "secret123"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("User Registered", response.json()["message"])
        self.assertTrue(AppUser.objects.filter(username="alice").exists())

    def test_register_duplicate_username(self):
        hashed = bcrypt.hashpw(b"secret", bcrypt.gensalt()).decode()
        AppUser.objects.create(name="Alice", username="alice", password=hashed)
        response = self.client.post(
            self.url,
            data=json.dumps({"name": "Alice2", "username": "alice", "password": "secret"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertIn("already exists", response.json()["message"])

    def test_register_missing_fields(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"username": "bob"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)


class LoginViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = "/api/v1/users/login"
        hashed = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode()
        self.user = AppUser.objects.create(name="Bob", username="bob", password=hashed)

    def test_login_success(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"username": "bob", "password": "password123"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertTrue(len(data["token"]) > 0)

    def test_login_wrong_password(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"username": "bob", "password": "wrongpass"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_login_user_not_found(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"username": "nobody", "password": "pass"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)


class MeetingHistoryViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        hashed = bcrypt.hashpw(b"pass", bcrypt.gensalt()).decode()
        self.user = AppUser.objects.create(
            name="Carol", username="carol", password=hashed, token="test-token-carol"
        )

    def test_add_to_activity(self):
        response = self.client.post(
            "/api/v1/users/add_to_activity",
            data=json.dumps({"token": "test-token-carol", "meeting_code": "room123"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Meeting.objects.filter(user=self.user, meeting_code="room123").exists())

    def test_get_all_activity(self):
        Meeting.objects.create(user=self.user, meeting_code="room1")
        Meeting.objects.create(user=self.user, meeting_code="room2")
        response = self.client.get(
            "/api/v1/users/get_all_activity",
            {"token": "test-token-carol"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        codes = {m["meetingCode"] for m in data}
        self.assertIn("room1", codes)
        self.assertIn("room2", codes)

    def test_add_activity_invalid_token(self):
        response = self.client.post(
            "/api/v1/users/add_to_activity",
            data=json.dumps({"token": "bad-token", "meeting_code": "room999"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_get_activity_invalid_token(self):
        response = self.client.get(
            "/api/v1/users/get_all_activity",
            {"token": "bad-token"},
        )
        self.assertEqual(response.status_code, 401)
