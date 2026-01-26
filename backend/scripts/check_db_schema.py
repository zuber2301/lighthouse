import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

async def check():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL not set")
        return
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'recognitions'"))
        columns = [r[0] for r in res]
        print(f"Columns in recognitions: {columns}")
        
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
        columns = [r[0] for r in res]
        print(f"Columns in users: {columns}")

if __name__ == "__main__":
    asyncio.run(check())
