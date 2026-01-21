from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import timedelta
from jose import jwt
from authlib.integrations.httpx_client import AsyncOAuth2Client
from app.db.session import get_db
from app.models.users import User, UserRole
from app.core.security import verify_password
from app.core.config import settings
import json
import urllib.parse


router = APIRouter(prefix="/auth")


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token"""
    # Find user by email
    user_q = await db.execute(select(User).where(User.email == request.email))
    user = user_q.scalar_one_or_none()

    # Development fallback: if DEV_DEFAULT_TENANT is configured, allow creating a dev user
    # when the account doesn't exist (makes local testing easier).
    if not user:
        if getattr(settings, 'DEV_DEFAULT_TENANT', None):
            # create a simple dev user (platform owner if email matches PLATFORM_ADMIN_EMAIL)
            is_platform_owner = request.email == settings.PLATFORM_ADMIN_EMAIL
            role = UserRole.PLATFORM_OWNER if is_platform_owner else UserRole.CORPORATE_USER
            
            # For platform owners, leave tenant_id NULL. For others, only assign if tenant exists.
            from app.models.tenants import Tenant
            tenant_id = None
            if not is_platform_owner:
                t_q = await db.execute(select(Tenant).where(Tenant.id == settings.DEV_DEFAULT_TENANT))
                if t_q.scalar_one_or_none():
                    tenant_id = settings.DEV_DEFAULT_TENANT

            user = User(email=request.email, full_name=request.email.split('@')[0], role=role, is_active=True, tenant_id=tenant_id)
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Ensure the configured platform admin email maps to PLATFORM_OWNER for existing users
    if user and user.email == settings.PLATFORM_ADMIN_EMAIL and user.role != UserRole.PLATFORM_OWNER:
        user.role = UserRole.PLATFORM_OWNER
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Verify password when a hashed password exists; otherwise accept for dev users
    if getattr(user, 'hashed_password', None):
        if not verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Create JWT token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id) if user.tenant_id else settings.DEV_DEFAULT_TENANT,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    }
    access_token = jwt.encode(token_data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return LoginResponse(
        access_token=access_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None
        }
    )


@router.get("/google")
async def google_login():
    """Initiate Google OAuth login"""
    if not settings.google_oidc_client_id or not settings.google_oidc_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )

    client = AsyncOAuth2Client(
        client_id=settings.google_oidc_client_id,
        client_secret=settings.google_oidc_client_secret,
        redirect_uri=settings.google_oidc_redirect_uri,
    )

    authorization_url, state = client.create_authorization_url(
        'https://accounts.google.com/o/oauth2/auth',
        scope=['openid', 'email', 'profile'],
    )

    return {"authorization_url": authorization_url, "state": state}


@router.get("/callback")
async def google_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    """Handle Google OAuth callback"""
    if not settings.google_oidc_client_id or not settings.google_oidc_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )

    client = AsyncOAuth2Client(
        client_id=settings.google_oidc_client_id,
        client_secret=settings.google_oidc_client_secret,
        redirect_uri=settings.google_oidc_redirect_uri,
    )

    try:
        token = await client.fetch_token(
            'https://oauth2.googleapis.com/token',
            code=code,
        )

        # Get user info from Google
        async with AsyncOAuth2Client(
            client_id=settings.google_oidc_client_id,
            token=token
        ) as client:
            user_info = await client.get('https://www.googleapis.com/oauth2/v2/userinfo')
            user_data = user_info.json()

        email = user_data['email']
        name = user_data.get('name', '')

        # Check if user exists
        user_q = await db.execute(select(User).where(User.email == email))
        user = user_q.scalar_one_or_none()

        if not user:
            # Create new user
            is_platform_owner = email == settings.PLATFORM_ADMIN_EMAIL
            role = UserRole.PLATFORM_OWNER if is_platform_owner else UserRole.CORPORATE_USER

            user = User(
                email=email,
                full_name=name,
                role=role,
                is_active=True,
                tenant_id=settings.DEV_DEFAULT_TENANT
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # Create JWT token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {
            "sub": str(user.id),
            "tenant_id": str(user.tenant_id) if user.tenant_id else settings.DEV_DEFAULT_TENANT,
            "role": user.role.value if hasattr(user.role, 'value') else user.role
        }
        access_token = jwt.encode(token_data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

        # Redirect to frontend with token
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        user_data_encoded = urllib.parse.quote(json.dumps({
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None
        }))
        
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}&user={user_data_encoded}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {str(e)}"
        )


@router.get("/health")
async def health():
    return {"status": "auth ok"}


@router.get("/dev-token")
async def dev_token(role: str = Query("PLATFORM_OWNER"), tenant_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Development helper: return a JWT for the configured PLATFORM_ADMIN_EMAIL.

    Only available when `DEV_DEFAULT_TENANT` is set. This helps local development
    when you need a token to call platform-admin endpoints.
    """
    if not getattr(settings, "DEV_DEFAULT_TENANT", None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="DEV_DEFAULT_TENANT not configured")

    # Normalize tenant_id to provided value or DEV_DEFAULT_TENANT
    tenant_id = tenant_id or settings.DEV_DEFAULT_TENANT

    # Validate requested role
    try:
        requested_role = UserRole[role]
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {role}")

    # For PLATFORM_OWNER, use PLATFORM_ADMIN_EMAIL; otherwise create/find a user with the requested role
    if requested_role == UserRole.PLATFORM_OWNER:
        user_q = await db.execute(select(User).where(User.email == settings.PLATFORM_ADMIN_EMAIL))
        user = user_q.scalar_one_or_none()
        if not user:
            user = User(email=settings.PLATFORM_ADMIN_EMAIL, full_name="Platform Owner", role=UserRole.PLATFORM_OWNER, is_active=True)
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # If a user exists but isn't PLATFORM_OWNER, update it to PLATFORM_OWNER
            if user.role != UserRole.PLATFORM_OWNER:
                user.role = UserRole.PLATFORM_OWNER
                db.add(user)
                await db.commit()
                await db.refresh(user)
    else:
        # Create or find a tenant-scoped user for dev. Only attach `tenant_id` if the tenant exists.
        dev_email = f"dev+{role.lower()}@example.local"
        # Search by email first to avoid unique constraint violation
        user_q = await db.execute(select(User).where(User.email == dev_email))
        user = user_q.scalar_one_or_none()
        if not user:
            # check tenant existence
            from app.models.tenants import Tenant
            t_q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            t_exists = t_q.scalar_one_or_none()
            attach_tenant = tenant_id if t_exists else None
            user = User(email=dev_email, full_name=f"Dev {role.title().replace('_',' ')}", role=requested_role, is_active=True, tenant_id=attach_tenant)
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Update role if it doesn't match
            if user.role != requested_role:
                user.role = requested_role
                await db.commit()
                await db.refresh(user)
            # Update tenant_id if needed
            from app.models.tenants import Tenant
            t_q = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            t_exists = t_q.scalar_one_or_none()
            attach_tenant = tenant_id if t_exists else None
            if user.tenant_id != attach_tenant:
                user.tenant_id = attach_tenant
                await db.commit()
                await db.refresh(user)

    token_data = {
        "sub": str(user.id),
        "tenant_id": tenant_id,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role)
    }
    access_token = jwt.encode(token_data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {"token": access_token, "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role.value if hasattr(user.role, 'value') else user.role, "tenant_id": tenant_id}}


class DevLoginRequest(BaseModel):
    email: str


@router.post("/dev-login")
async def dev_login(request: DevLoginRequest, db: AsyncSession = Depends(get_db)):
    """Developer helper: find a user by email and return a signed JWT for local testing.

    This endpoint is intended for local development only. It requires the app
    to be running with `DEV_DEFAULT_TENANT` configured to be available.
    """
    if not getattr(settings, 'DEV_DEFAULT_TENANT', None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="DEV_DEFAULT_TENANT not configured")

    # Find the user by email
    user_q = await db.execute(select(User).where(User.email == request.email))
    user = user_q.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # If this is the configured platform admin email, ensure role is PLATFORM_OWNER
    if user.email == settings.PLATFORM_ADMIN_EMAIL and user.role != UserRole.PLATFORM_OWNER:
        user.role = UserRole.PLATFORM_OWNER
        db.add(user)
        await db.commit()
        await db.refresh(user)
    token_data = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "role": user.role.value if hasattr(user.role, 'value') else user.role
    }
    access_token = jwt.encode(token_data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {"token": access_token, "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name, "role": user.role.value if hasattr(user.role, 'value') else user.role, "tenant_id": str(user.tenant_id) if user.tenant_id else None}}
