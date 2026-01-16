"""User sync job skeleton.

This job demonstrates a safe pattern for syncing users from SSO/HRIS
providers into local `User` records using `external_id` and `sso_provider`.

Pattern:
- Fetch external users
- Upsert local users keyed by (tenant_id, external_id, sso_provider)
- After creating/updating users, run a pass to resolve manager relationships

Scheduling: run this via an async worker (Celery, APScheduler) or a Kubernetes CronJob.
"""
from typing import Iterable
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User as UserModel
from app.db.session import AsyncSessionLocal
from app.integrations import okta, azure_ad, workday
from app.core.config import settings


async def _upsert_user(session: AsyncSession, tenant_id: str, provider: str, mapped: dict):
    """Upsert a single user record based on external_id and provider.

    `mapped` is expected to come from provider.map_to_local()
    """
    external_id = mapped.get("external_id")
    if not external_id:
        return None

    stmt = select(UserModel).where(
        UserModel.tenant_id == tenant_id,
        UserModel.external_id == external_id,
        UserModel.sso_provider == provider,
    )
    res = await session.execute(stmt)
    user = res.scalar_one_or_none()
    if user is None:
        user = UserModel(
            id=None,  # let application generate/assign ID if needed (fill in your generator)
            tenant_id=tenant_id,
            email=mapped.get("email") or f"{external_id}@unknown",
            role="EMPLOYEE",
            external_id=external_id,
            sso_provider=provider,
        )
        session.add(user)
        await session.flush()
    else:
        # update fields
        user.email = mapped.get("email") or user.email
        user.external_id = external_id
        user.sso_provider = provider
        session.add(user)

    return user


async def sync_from_okta(tenant_id: str, okta_base: str, okta_token: str):
    client = okta.OktaClient(okta_base, okta_token)
    users = []
    async with AsyncSessionLocal() as session:
        async with session.begin():
            async for ext in client.fetch_users():
                mapped = okta.map_to_local(ext)
                u = await _upsert_user(session, tenant_id, "okta", mapped)
                users.append((mapped, u))

    # second pass: resolve manager relationships (using external ids)
    async with AsyncSessionLocal() as session:
        async with session.begin():
            for mapped, local in users:
                mgr_ext = mapped.get("manager_external_id")
                if mgr_ext:
                    stmt = select(UserModel).where(
                        UserModel.tenant_id == tenant_id,
                        UserModel.external_id == mgr_ext,
                    )
                    res = await session.execute(stmt)
                    mgr = res.scalar_one_or_none()
                    if mgr and local:
                        local.manager_id = mgr.id
                        session.add(local)


async def sync_from_provider(provider: str, tenant_id: str, config: dict):
    if provider == "okta":
        await sync_from_okta(tenant_id, config.get("base_url"), config.get("token"))
    elif provider == "azure_ad":
        # add azure sync implementation
        pass
    elif provider == "workday":
        # add workday sync implementation
        pass
    else:
        raise ValueError("unknown provider")


if __name__ == "__main__":
    # simple CLI for local testing
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("provider")
    parser.add_argument("tenant_id")
    args = parser.parse_args()

    # config would typically come from vault or environment
    cfg = {}
    asyncio.run(sync_from_provider(args.provider, args.tenant_id, cfg))
