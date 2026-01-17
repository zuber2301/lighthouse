from fastapi import APIRouter, Depends, HTTPException, status
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
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Verify password (assuming password is hashed)
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    # Create JWT token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
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
            is_platform_admin = email == settings.PLATFORM_ADMIN_EMAIL
            role = UserRole.PLATFORM_ADMIN if is_platform_admin else UserRole.CORPORATE_USER

            user = User(
                email=email,
                full_name=name,
                role=role,
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # Create JWT token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {
            "sub": str(user.id),
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "role": user.role.value if hasattr(user.role, 'value') else user.role
        }
        access_token = jwt.encode(token_data, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

        # Redirect to frontend with token
        frontend_url = "http://localhost:3004"
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
