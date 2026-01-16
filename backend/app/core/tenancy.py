from typing import Optional
from fastapi import Request, Header, HTTPException, status
from jose import jwt, JWTError
from .config import settings
import contextvars
from contextlib import contextmanager


# Context variable used by DB-layer to automatically scope queries
CURRENT_TENANT: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_tenant", default=None)
# bypass flag allows explicit opt-out from tenant scoping (for super-admin/analytics)
_BYPASS_TENANT: contextvars.ContextVar[bool] = contextvars.ContextVar("bypass_tenant", default=False)


def _decode_jwt_get_tenant(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("tenant_id")
    except JWTError:
        return None


def get_current_tenant(request: Request, x_tenant_id: Optional[str] = Header(None)) -> str:
    """Resolve tenant from JWT claim `tenant_id` with header fallback `X-Tenant-ID`.

    In development, if no header or JWT is present and `settings.DEV_DEFAULT_TENANT`
    is set, it will be returned as a fallback tenant. Otherwise raises 401.
    """
    auth: str = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        tenant = _decode_jwt_get_tenant(token)
        if tenant:
            return tenant

    if x_tenant_id:
        return x_tenant_id

    # Development fallback: use configured DEV_DEFAULT_TENANT if present
    if getattr(settings, "DEV_DEFAULT_TENANT", None):
        return settings.DEV_DEFAULT_TENANT

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tenant not provided")


@contextmanager
def without_tenant():
    """Context manager to temporarily clear the current tenant so DB operations
    run without tenant scoping.

    Usage:
        with tenancy.without_tenant():
            # perform cross-tenant queries
    """
    token = CURRENT_TENANT.set(None)
    try:
        yield
    finally:
        CURRENT_TENANT.reset(token)


def set_current_tenant(tenant_id: Optional[str]):
    """Programmatically set the current tenant in the context var."""
    CURRENT_TENANT.set(tenant_id)


def bypass_tenant_filter():
    """Enable bypass for the current context (use sparingly)."""
    _BYPASS_TENANT.set(True)


def clear_bypass_tenant_filter():
    """Clear bypass flag for current context."""
    _BYPASS_TENANT.set(False)


def is_bypass_enabled() -> bool:
    return _BYPASS_TENANT.get(False)


@contextmanager
def bypass_tenant_context():
    token = _BYPASS_TENANT.set(True)
    try:
        yield
    finally:
        _BYPASS_TENANT.reset(token)
