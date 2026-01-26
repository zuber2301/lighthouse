
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine("postgresql+asyncpg://lighthouse:lighthouse@localhost:5432/lighthouse")
    async with engine.connect() as conn:
        try:
            res = await conn.execute(text("SELECT avatar_url FROM users LIMIT 1"))
            print("avatar_url exists in users")
        except Exception as e:
            print(f"avatar_url MISSING in users: {e}")
            
        try:
            res = await conn.execute(text("SELECT award_category FROM recognitions LIMIT 1"))
            print("award_category exists in recognitions")
        except Exception as e:
            print(f"award_category MISSING in recognitions: {e}")

if __name__ == "__main__":
    asyncio.run(check())
