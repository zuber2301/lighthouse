"""Seed hashed passwords for initial users

Revision ID: 0007
Revises: 0006
Create Date: 2026-01-18 13:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # Set deterministic hashed passwords (default: 'password') for seeded users where missing
    updates = {
        'mohammed.zuber@gmail.com': '$pbkdf2-sha256$29000$IaSUknIO4RwDQMg5J.Sckw$Alp0LSHCNMr5D0C2eKAXQXXbUAXwyTX.6KzuG5MxACI',
        'admin@acme.com': '$pbkdf2-sha256$29000$2/ufs1aKUQrhXIvRWivFOA$vESwY/L0VKIHMbNOXb4avbe/Aky4N0KSrIF61U1t1EY',
        'mj2@gmail.com': '$pbkdf2-sha256$29000$8L4Xwlhr7d1byxnjfE.pFQ$8jB/M4pZfDSy8zbAsOo6tIsankOJobJfKSpBiSoPJxQ',
        'dev+tenant_admin@example.local': '$pbkdf2-sha256$29000$fO8dwzhnLCUEgJDyXssZ4w$E6eEIgWE1170ydjCNicH4kbgqAQFMmECCBZdXDgzQ5M',
        'john@tigercorp.com': '$pbkdf2-sha256$29000$zBmjVIqxFuL8n3MOoTSGUA$esTDfmbgcQUecQcWkOsVNRcQH.k7G.4BdrvQ7IJtJCQ',
        'Jimmy@murphy.com': '$pbkdf2-sha256$29000$RYjR.t.b87733vt/D6GUsg$clUUub/XNSaYI3gDadB2D1Yazl25afy8P5vtZQtwyBg',
        'chris@triton.com': '$pbkdf2-sha256$29000$lXIuJYRwjrH2Xmvt3RtjbA$9.Wba42PBoJCJC0uGdAx2qPJ2q6.k4A3dx6Go2HEHf0',
        'suresh@acme.com': '$pbkdf2-sha256$29000$tnaOESLEuHduTQkhpJRSCg$UIbbwlbXaXzLlm.a2gzSR68NLjIW736gcAzrhA3D3UM',
        'priya@acme.com': '$pbkdf2-sha256$29000$JmTsPQfAWGttjdE6R.i9dw$PXPr57RiofJAGbxhkLobz0M8YAdAEMW4jLp61NK6l68',
    }

    for email, h in updates.items():
        conn.execute(sa.text("UPDATE users SET hashed_password = :h WHERE email = :e AND (hashed_password IS NULL OR hashed_password = '')"), {'h': h, 'e': email})


def downgrade() -> None:
    conn = op.get_bind()
    emails = [
        'mohammed.zuber@gmail.com','admin@acme.com','mj2@gmail.com','dev+tenant_admin@example.local',
        'john@tigercorp.com','Jimmy@murphy.com','chris@triton.com','suresh@acme.com','priya@acme.com'
    ]
    for e in emails:
        conn.execute(sa.text("UPDATE users SET hashed_password = NULL WHERE email = :e"), {'e': e})
