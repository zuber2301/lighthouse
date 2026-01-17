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
from app.models.users import User
from app.models.platform import PlatformSettings
from app.core.security import get_password_hash
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_data():
    async with async_session() as session:
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
        
        await session.commit()
        print("Seeded initial data")

if __name__ == "__main__":
    asyncio.run(seed_data())