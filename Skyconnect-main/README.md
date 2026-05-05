# SkyConnect
A lightweight, real-time video conferencing platform built with React + Django and WebRTC.

## MVP Description

**Problem Statement**: Existing video conferencing tools are often complex, resource-heavy, and lack customization for organizations needing lightweight, private, and scalable communication solutions.

**Solution**: SkyConnect provides a lightweight, real-time video conferencing platform that enables secure peer-to-peer communication through WebRTC, with a Python/Django backend and SQL database for rapid scalability and cloud integration.

## Core MVP Features ✅

- ✅ **User Authentication** – Secure sign-up and login with token-based auth
- ✅ **Room Creation & Joining** – Unique room IDs for instant video meetings
- ✅ **Real-Time Video/Audio Calls** – Powered by WebRTC peer connections
- ✅ **Chat Feature** – Text messaging during calls using WebSockets (Socket.io)
- ✅ **Responsive UI** – Built with React and Tailwind CSS for smooth user experience
- ✅ **Screen Sharing** – Share your screen during video calls

## Tech Architecture

- **Frontend**: React.js (UI), WebRTC (Media Stream), Socket.io client (Signaling)
- **Backend**: Python + Django (REST API), python-socketio (Socket.io signaling server), Uvicorn (ASGI)
- **Database**: SQLite (SQL) – easily switchable to PostgreSQL/MySQL via Django settings
- **Deployment**: Cloud-ready (Render, Vercel, or AWS)

## Backend API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/users/register` | Register a new user |
| POST | `/api/v1/users/login` | Login and receive auth token |
| POST | `/api/v1/users/add_to_activity` | Save a meeting to history |
| GET  | `/api/v1/users/get_all_activity` | Fetch meeting history for a token |

## Future Enhancements

- Screen recording functionality
- End-to-end encryption
- Multi-user conferencing with scalable TURN/STUN servers
- Integration with calendar and cloud storage

## Getting Started

### Backend Setup (Django + Python)
```bash
cd backend

# Create and activate virtual environment (recommended)
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env

# Apply database migrations (creates SQLite db.sqlite3)
python manage.py migrate

# Start the server (ASGI with Socket.io support)
uvicorn skyconnect.asgi:application --host 0.0.0.0 --port 8000 --reload

# (Optional) Run tests
python manage.py test users
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
Skyconnect-main/
├── backend/                     # Django Python backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── skyconnect/              # Django project package
│   │   ├── settings.py          # Django settings (SQLite DB)
│   │   ├── urls.py              # Root URL configuration
│   │   ├── asgi.py              # ASGI entry-point (Django + Socket.io)
│   │   └── wsgi.py
│   ├── users/                   # REST API app
│   │   ├── models.py            # AppUser, Meeting (SQL models)
│   │   ├── views.py             # Login, Register, History views
│   │   ├── urls.py
│   │   └── tests.py
│   └── socket_server/           # Socket.io signaling server
│       └── events.py            # WebRTC signaling events
└── frontend/                    # React frontend (unchanged)
```

## MVP Objective

Validate that users can create and join real-time video meetings seamlessly with stable connections, simple UI, and secure communication—proving the technical and market feasibility of a custom-built WebRTC platform with a Python/Django backend.
