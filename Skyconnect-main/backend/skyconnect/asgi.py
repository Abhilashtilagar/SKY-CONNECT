"""
ASGI configuration for skyconnect project.

Combines Django (REST API) with python-socketio (Socket.io WebSocket signaling)
so the frontend socket.io-client continues to work without any changes.
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skyconnect.settings")
django.setup()

from django.core.asgi import get_asgi_application
import socketio

from socket_server.events import sio  # noqa: E402  (imported after django.setup)

# Wrap Django's ASGI application with Socket.io
django_app = get_asgi_application()
application = socketio.ASGIApp(sio, django_app)
