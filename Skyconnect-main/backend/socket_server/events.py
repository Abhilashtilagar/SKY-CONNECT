"""
Socket.io event handlers – Python/Django equivalent of the Node.js socketManager.js.

Uses python-socketio (AsyncServer) which implements the Socket.io protocol so
the existing frontend socket.io-client continues to work without modification.

In-memory state is sufficient for a single-process deployment (uvicorn).
For multi-process / multi-server deployments, replace with a Redis-backed
python-socketio manager:
    sio = socketio.AsyncServer(client_manager=socketio.AsyncRedisManager(url))
"""

import socketio
import time

# ---------------------------------------------------------------------------
# Server instance (shared across the ASGI app in skyconnect/asgi.py)
# ---------------------------------------------------------------------------
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# ---------------------------------------------------------------------------
# In-memory room / user state
# ---------------------------------------------------------------------------
connections: dict[str, list[str]] = {}   # room_path -> [socket_id, ...]
messages: dict[str, list[dict]] = {}     # room_path -> [{sender, data, socket_id}]
time_online: dict[str, float] = {}       # socket_id -> join timestamp
usernames: dict[str, str] = {}           # socket_id -> username


# ---------------------------------------------------------------------------
# Helper: find the room a socket belongs to
# ---------------------------------------------------------------------------
def _find_room(sid: str) -> str | None:
    for room, members in connections.items():
        if sid in members:
            return room
    return None


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

@sio.event
async def connect(sid, environ):
    print(f"SOMETHING CONNECTED: {sid}")


@sio.on("join-call")
async def join_call(sid, path, username=None):
    """
    Client emits 'join-call' (hyphenated).
    python-socketio passes event names verbatim so @sio.on("join-call") is required.
    """

    print(f"🔗 User joining: {username} in room: {path}")

    if path not in connections:
        connections[path] = []

    connections[path].append(sid)
    usernames[sid] = username or f"User {sid[:4]}"
    time_online[sid] = time.time()

    is_host = len(connections[path]) == 1
    print(
        f"👥 Room {path} now has {len(connections[path])} users. "
        f"{sid} is {'HOST' if is_host else 'participant'}"
    )

    # Tell the joining user whether they are the host
    await sio.emit("host-status", {"isHost": is_host}, to=sid)

    # Notify all existing users about the new arrival
    for existing_sid in connections[path][:-1]:
        print(f"📢 Notifying {existing_sid} about new user {sid}")
        await sio.emit(
            "user-joined",
            {"userId": sid, "username": usernames[sid]},
            to=existing_sid,
        )

    # Send the list of already-connected users to the newcomer
    if len(connections[path]) > 1:
        existing_users = [
            {"userId": s, "username": usernames[s]}
            for s in connections[path][:-1]
        ]
        print(f"📋 Sending existing users to {sid}:", existing_users)
        await sio.emit("existing-users", existing_users, to=sid)

    # Replay chat history
    if path in messages:
        for msg in messages[path]:
            await sio.emit(
                "chat-message",
                (msg["data"], msg["sender"], msg["socket_id"]),
                to=sid,
            )


@sio.event
async def signal(sid, to_id, message):
    """Relay WebRTC signalling message between peers."""
    print(
        f"📡 WebRTC Signal: {usernames.get(sid, sid)} -> "
        f"{usernames.get(to_id, to_id)}, type: {message.get('type') if isinstance(message, dict) else ''}"
    )
    await sio.emit("signal", (sid, message), to=to_id)


@sio.on("chat-message")
async def chat_message(sid, data, sender):
    room = _find_room(sid)
    if room is None:
        return

    if room not in messages:
        messages[room] = []
    messages[room].append({"sender": sender, "data": data, "socket_id": sid})
    print(f"💬 message {room}: {sender} {data}")

    for member_sid in connections[room]:
        await sio.emit("chat-message", (data, sender, sid), to=member_sid)


@sio.on("screen-share-started")
async def screen_share_started(sid, user_id):
    room = _find_room(sid)
    if room is None:
        return
    for member_sid in connections[room]:
        if member_sid != sid:
            await sio.emit("screen-share-started", user_id, to=member_sid)


@sio.on("screen-share-ended")
async def screen_share_ended(sid, user_id):
    room = _find_room(sid)
    if room is None:
        return
    for member_sid in connections[room]:
        if member_sid != sid:
            await sio.emit("screen-share-ended", user_id, to=member_sid)


@sio.on("typing-start")
async def typing_start(sid, username):
    room = _find_room(sid)
    if room is None:
        return
    for member_sid in connections[room]:
        if member_sid != sid:
            await sio.emit("typing-start", (username, sid), to=member_sid)


@sio.on("typing-stop")
async def typing_stop(sid):
    room = _find_room(sid)
    if room is None:
        return
    for member_sid in connections[room]:
        if member_sid != sid:
            await sio.emit("typing-stop", sid, to=member_sid)


@sio.on("pin-note")
async def pin_note(sid, note_data):
    room = _find_room(sid)
    if room is None:
        return
    print(f"📌 Note pinned in {room}: {note_data.get('text') if isinstance(note_data, dict) else note_data}")
    for member_sid in connections[room]:
        await sio.emit("pin-note", note_data, to=member_sid)


@sio.on("dismiss-note")
async def dismiss_note(sid):
    room = _find_room(sid)
    if room is None:
        return
    print(f"❌ Note dismissed in {room}")
    for member_sid in connections[room]:
        await sio.emit("dismiss-note", to=member_sid)


@sio.event
async def disconnect(sid):
    print(f"🔌 User disconnected: {sid}")

    join_time = time_online.pop(sid, None)
    if join_time:
        diff = time.time() - join_time
        print(f"⏱️ User {sid} was online for {diff:.1f}s")

    # Find and clean up the user's room
    for room in list(connections.keys()):
        if sid in connections[room]:
            # Notify everyone in the room
            for member_sid in connections[room]:
                await sio.emit("user-left", sid, to=member_sid)

            connections[room].remove(sid)

            if not connections[room]:
                del connections[room]
                print(f"🗑️ Room {room} deleted (empty)")
            break

    usernames.pop(sid, None)
