from fastapi import Depends, HTTPException, status
from app.core.auth import get_current_user, User


def require_role(*roles: str):
    def checker(user: User = Depends(get_current_user)):
        # Normalize role comparison to handle enum values or raw strings
        user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        allowed = set(roles or [])
        if user_role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return checker

    return checker
