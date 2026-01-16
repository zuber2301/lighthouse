from fastapi import APIRouter

router = APIRouter(prefix="/auth")

@router.get("/health")
async def health():
    return {"status": "auth ok"}
