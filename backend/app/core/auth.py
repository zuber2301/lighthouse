from pydantic import BaseModel
from fastapi import Request, HTTPException, status
from jose import jwt, JWTError
from app.core.config import settings


class TokenPayload(BaseModel):
    sub: str | None = None
    tenant_id: str | None = None
    role: str | None = None


class User(BaseModel):
    id: str
    tenant_id: str
    role: str


def _decode_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return TokenPayload(**payload)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")


def get_current_user(request: Request) -> User:
    """Dependency that returns the current user derived from a JWT Bearer token.

    Expects standard `Authorization: Bearer <token>` header. Token must include
    `sub`, `tenant_id`, and `role` claims.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    token = auth.split(" ", 1)[1]
    tp = _decode_token(token)
    if not tp.sub or not tp.tenant_id or not tp.role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return User(id=tp.sub, tenant_id=tp.tenant_id, role=tp.role)
