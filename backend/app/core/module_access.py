from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user, User as CurrentUser
from app.db.session import get_db
from app.models.tenants import Tenant


def check_module_access(module_name: str):
    """Factory that returns a FastAPI dependency which ensures the current
    user's tenant has the requested module enabled in `feature_flags`.

    Usage:
        @router.get("/some")
        async def view(dep=Depends(check_module_access('ai_coach'))):
            ...
    """

    async def _dependency(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        # If no tenant on the user (platform-level caller), allow by default
        tenant_id = getattr(user, 'tenant_id', None)
        if not tenant_id:
            return True

        q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = q.scalar_one_or_none()
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

        flags = getattr(tenant, 'feature_flags', None) or {}
        # flag key convention: module_name + '_enabled' or direct module_name boolean
        enabled = flags.get(f"{module_name}_enabled", flags.get(module_name, True))
        if enabled is False:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Module '{module_name}' not enabled for tenant")
        return True

    return _dependency
