import asyncio
import os
import sys

# Ensure app is in path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from app.services.hr_sync import sync_hr_data
from app.services.milestone_service import run_milestone_check

async def main():
    # 1. Sync HR Data from CSV
    # csv_path is relative to this script: ../../data/hr_sync.csv
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.abspath(os.path.join(base_dir, "..", "..", "data", "hr_sync.csv"))
    print(f"Starting HR Sync from {csv_path}...")
    await sync_hr_data(csv_path)
    
    # 2. Process today's milestones (birthdays & anniversaries)
    print("Checking for today's milestones...")
    await run_milestone_check()
    
    print("All tasks completed.")

if __name__ == "__main__":
    asyncio.run(main())
