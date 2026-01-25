from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core import tenancy
from app.api import auth, recognition, rewards, platform_admin, tenant_admin, analytics, tenant_lead, corporate_user, badges, milestones
from app.api import dashboard, admin_dashboard
from app.api import dashboard
from app.db.base import Base
from app.db.session import engine
from app.core.sockets import socket_app
import asyncio


app = FastAPI(title="lighthouse-backend")
app.mount("/ws", socket_app)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # Frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def create_tables():
    # Temporarily bypass tenant checking during table creation
    from app.core import tenancy
    import datetime
    token = tenancy._BYPASS_TENANT.set(True)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        # record start time for basic uptime reporting
        app.state.start_time = datetime.datetime.utcnow()
    finally:
        tenancy._BYPASS_TENANT.reset(token)

    # In development, ensure test personas exist if DEV_DEFAULT_TENANT is configured
    try:
        from app.core.config import settings
        if getattr(settings, "DEV_DEFAULT_TENANT", None):
            try:
                from app.scripts.seed_test_personas import seed_test_personas
                await seed_test_personas()
            except Exception as _e:
                # avoid crashing startup for non-fatal seed issues
                print("seed_test_personas error:", _e)
    except Exception:
        pass


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip tenant resolution for platform admin routes, auth routes, and root/docs routes
        if (request.url.path.startswith("/platform") or 
            request.url.path.startswith("/auth") or 
            request.url.path in ["/", "/docs", "/redoc", "/openapi.json"] or
            request.url.path.startswith("/favicon")):
            request.state.tenant_id = None
            token = tenancy.CURRENT_TENANT.set(None)
            bypass_token = tenancy._BYPASS_TENANT.set(True)
            try:
                return await call_next(request)
            finally:
                tenancy.CURRENT_TENANT.reset(token)
                tenancy._BYPASS_TENANT.reset(bypass_token)
        
        # Resolve tenant and attach to request.state before any route handling
        # pass header explicitly to avoid FastAPI `Header` default object
        tenant_id = tenancy.get_current_tenant(request, request.headers.get("X-Tenant-ID"))
        request.state.tenant_id = tenant_id
        # set context var so DB sessions can pick it up for automatic scoping
        token = tenancy.CURRENT_TENANT.set(tenant_id)
        try:
            return await call_next(request)
        finally:
            tenancy.CURRENT_TENANT.reset(token)


app.add_middleware(TenantMiddleware)

# Serve uploaded files from /uploads
try:
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception:
    # if directory is missing or mount fails during some CI flows, ignore
    pass

app.include_router(auth.router)
app.include_router(recognition.router)
app.include_router(rewards.router)
app.include_router(badges.router)
app.include_router(platform_admin.router)
app.include_router(tenant_admin.router)
app.include_router(tenant_lead.router)
app.include_router(corporate_user.router)
app.include_router(analytics.router)
app.include_router(dashboard.router)
app.include_router(admin_dashboard.router)
app.include_router(milestones.router)


@app.get("/")
async def root(request: Request):
    return {"message": "Lighthouse backend running", "tenant": getattr(request.state, "tenant_id", None)}
