import csv
import os
import asyncio
from datetime import datetime
from sqlalchemy import select, update, insert
from app.db.session import AsyncSessionLocal
from app.models.users import User, UserRole

async def sync_hr_data(file_path: str):
    """
    Syncs HR data from a CSV file into the users table.
    Expected CSV columns: email, dob, hire_date, full_name, department, job_title
    """
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    records = []
    try:
        with open(file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(row)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    print(f"Processing {len(records)} employee records...")
    
    async with AsyncSessionLocal() as db:
        for row in records:
            email = row.get('email')
            if not email:
                continue
            
            try:
                # Parse dates with basic validation
                dob = None
                if row.get('dob'):
                    try:
                        dob = datetime.strptime(row.get('dob'), '%Y-%m-%d').date()
                    except ValueError:
                        print(f"Invalid DOB format for {email}: {row.get('dob')}")
                
                hire_date = None
                if row.get('hire_date'):
                    try:
                        hire_date = datetime.strptime(row.get('hire_date'), '%Y-%m-%d').date()
                    except ValueError:
                        print(f"Invalid hire_date format for {email}: {row.get('hire_date')}")

                # Check if user exists
                stmt = select(User).where(User.email == email)
                res = await db.execute(stmt)
                user = res.scalar_one_or_none()

                values = {
                    "full_name": row.get('full_name') or (user.full_name if user else None),
                    "date_of_birth": dob or (user.date_of_birth if user else None),
                    "hire_date": hire_date or (user.hire_date if user else None),
                    "department": row.get('department') or (user.department if user else None),
                    "job_title": row.get('job_title') or (user.job_title if user else None),
                    "tenant_id": row.get('tenant_id') or (user.tenant_id if user else None),
                }

                if user:
                    # Update existing user
                    await db.execute(
                        update(User).where(User.id == user.id).values(**values)
                    )
                else:
                    # Insert new user (defaulting to CORPORATE_USER)
                    # Note: In a real multi-tenant app, you'd need tenant_id from context or CSV
                    new_user_data = {
                        "email": email,
                        "role": UserRole.CORPORATE_USER,
                        "is_active": True,
                        **values
                    }
                    await db.execute(insert(User).values(**new_user_data))
                
                await db.commit()
            except Exception as e:
                await db.rollback()
                print(f"Error syncing user {email}: {e}")
    
    print("HR Sync Completed successfully.")

if __name__ == "__main__":
    # For manual testing
    data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "hr_sync.csv")
    asyncio.run(sync_hr_data(data_path))
