#!/usr/bin/env python3
"""Seed initial data for the platform."""

import asyncio
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.db.base import Base
from app.models.subscriptions import SubscriptionPlan
from app.models.global_rewards import GlobalReward
from app.models.users import User, UserRole
from app.models.tenants import Tenant
from app.models.platform import PlatformSettings
from app.core.security import get_password_hash
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_data():
    async with async_session() as session:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        # Note: Super admin user creation skipped - authentication is SSO-based
        # Platform admin access is handled through middleware bypass for /platform routes
        
        # Seed subscription plans
        plans = [
            SubscriptionPlan(
                name="Starter",
                monthly_price_in_paise=2900,  # $29 in paise
                features={"max_users": 50, "max_recognitions_per_month": 1000, "description": "Basic recognition platform", "features": ["Basic recognition", "Email notifications", "Standard reports"]}
            ),
            SubscriptionPlan(
                name="Professional",
                monthly_price_in_paise=7900,  # $79 in paise
                features={"max_users": 200, "max_recognitions_per_month": 5000, "description": "Advanced recognition with analytics", "features": ["All starter features", "Advanced analytics", "Custom rewards", "API access"]}
            ),
            SubscriptionPlan(
                name="Enterprise",
                monthly_price_in_paise=19900,  # $199 in paise
                features={"max_users": 1000, "max_recognitions_per_month": -1, "description": "Full-featured platform", "features": ["All professional features", "White-labeling", "Priority support", "Custom integrations"]}
            )
        ]
        
        for plan in plans:
            result = await session.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == plan.name))
            if not result.scalar():
                session.add(plan)
                print(f"Created subscription plan: {plan.name}")
        
        # Create platform admin user
        platform_admin_email = settings.PLATFORM_ADMIN_EMAIL
        result = await session.execute(select(User).where(User.email == platform_admin_email))
        if not result.scalar():
            platform_admin = User(
                email=platform_admin_email,
                full_name="Platform Administrator",
                role=UserRole.PLATFORM_ADMIN,
                is_active=True
            )
            session.add(platform_admin)
            print(f"Created platform admin: {platform_admin_email}")
        
        # Seed global rewards
        rewards = [
            GlobalReward(title="Amazon Gift Card", provider="Amazon", points_cost=1000, is_enabled=True),
            GlobalReward(title="Starbucks Gift Card", provider="Starbucks", points_cost=800, is_enabled=True),
            GlobalReward(title="Extra Vacation Day", provider="Company", points_cost=2000, is_enabled=True),
        ]
        
        for reward in rewards:
            result = await session.execute(select(GlobalReward).where(GlobalReward.title == reward.title))
            if not result.scalar():
                session.add(reward)
                print(f"Created global reward: {reward.title}")
        
        # Create platform settings
        settings_obj = PlatformSettings(
            id="global",
            policies={"platform_name": "Lighthouse", "version": "1.0.0"}
        )
        result = await session.execute(select(PlatformSettings).where(PlatformSettings.id == "global"))
        if not result.scalar():
            session.add(settings_obj)
            print("Created platform settings")
        
        # Create a test tenant
        test_tenant = Tenant(
            name="Acme Corporation",
            subdomain="acme",
            master_budget_balance=10000000,  # 1 lakh rupees in paise
            status="active"
        )
        result = await session.execute(select(Tenant).where(Tenant.subdomain == "acme"))
        if not result.scalar():
            session.add(test_tenant)
            await session.commit()
            await session.refresh(test_tenant)
            print("Created test tenant: Acme Corporation")

            # Create tenant admin
            tenant_admin = User(
                tenant_id=test_tenant.id,
                email="admin@acme.com",
                hashed_password=get_password_hash("password"),
                full_name="John Admin",
                role=UserRole.TENANT_ADMIN,
                is_active=True
            )
            session.add(tenant_admin)

            # Create tenant leads
            lead1 = User(
                tenant_id=test_tenant.id,
                email="rajesh@acme.com",
                hashed_password=get_password_hash("password"),
                full_name="Rajesh Kumar",
                role=UserRole.TENANT_LEAD,
                lead_budget_balance=200000,  # 2000 rupees in paise
                is_active=True
            )
            session.add(lead1)

            lead2 = User(
                tenant_id=test_tenant.id,
                email="anita@acme.com",
                hashed_password=get_password_hash("password"),
                full_name="Anita Sharma",
                role=UserRole.TENANT_LEAD,
                lead_budget_balance=200000,  # 2000 rupees in paise
                is_active=True
            )
            session.add(lead2)

            # Create corporate users
            user1 = User(
                tenant_id=test_tenant.id,
                email="suresh@acme.com",
                hashed_password=get_password_hash("password"),
                full_name="Suresh Patel",
                role=UserRole.CORPORATE_USER,
                points_balance=500,
                is_active=True
            )
            session.add(user1)

            user2 = User(
                tenant_id=test_tenant.id,
                email="priya@acme.com",
                hashed_password=get_password_hash("password"),
                full_name="Priya Singh",
                role=UserRole.CORPORATE_USER,
                points_balance=750,
                is_active=True
            )
            session.add(user2)

            await session.commit()
            print("Created test users for Acme Corporation")

if __name__ == "__main__":
    asyncio.run(seed_data())