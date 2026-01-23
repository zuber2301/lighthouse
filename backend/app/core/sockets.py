import socketio
from typing import Any

# Standard socket.io server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

async def emit_platform_event(event_name: str, data: Any):
    """Broadcast a platform-level event to all connected platform owners."""
    await sio.emit(event_name, data)

@sio.event
async def connect(sid, environ):
    # In a real app, we would verify the user role from JWT here
    print(f"Socket connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Socket disconnected: {sid}")
