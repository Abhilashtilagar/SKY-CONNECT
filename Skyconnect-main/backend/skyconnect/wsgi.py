"""
WSGI configuration for skyconnect project.
Use this only for plain WSGI deployments (no WebSocket support).
For WebSocket (Socket.io) support, use asgi.py with uvicorn.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skyconnect.settings")

application = get_wsgi_application()
