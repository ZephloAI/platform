"""
Unit tests for UsageService enforcement.

Covers all three limit paths (max_users, max_agents, max_tokens_per_period)
plus the incremental counter bump and monthly rollover logic.
"""

import datetime as dt

import pytest
from fastapi import HTTPException

from app.models import Chatbot, OrganizationMember, User
from app.services.usage_service import (
    ERR_MAX_AGENTS,
    ERR_MAX_TOKENS,
    ERR_MAX_USERS,
    ERR_ORG_SUSPENDED,
    UsageService,
)


pytestmark = pytest.mark.asyncio


async def _add_user_member(db, org_id, email):
    u = User(email=email, password_hash="x")
    db.add(u)
    await db.commit()
    await db.refresh(u)
    db.add(OrganizationMember(organization_id=org_id, user_id=u.id, role="member"))
    await db.commit()


async def _add_agent(db, org_id, name="Agent"):
    c = Chatbot(user_id=1, name=name, organization_id=org_id)
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c


# ------------------------------------------------------------------
# max_users
# ------------------------------------------------------------------


async def test_enforce_max_users_allows_when_unlimited(db, org):
    org.max_users = None
    await db.commit()
    await UsageService(db).enforce_max_users(org.id)


async def test_enforce_max_users_allows_when_under_limit(db, org):
    org.max_users = 3
    await db.commit()
    await _add_user_member(db, org.id, "a@example.com")
    await UsageService(db).enforce_max_users(org.id)


async def test_enforce_max_users_blocks_when_at_limit(db, org):
    org.max_users = 1  # creator is already member #1
    await db.commit()
    with pytest.raises(HTTPException) as exc:
        await UsageService(db).enforce_max_users(org.id)
    assert exc.value.status_code == 402
    assert exc.value.detail["code"] == ERR_MAX_USERS
    assert exc.value.detail["limit"] == 1


# ------------------------------------------------------------------
# max_agents
# ------------------------------------------------------------------


async def test_enforce_max_agents_allows_when_unlimited(db, org):
    org.max_agents = None
    await db.commit()
    await UsageService(db).enforce_max_agents(org.id)


async def test_enforce_max_agents_blocks_when_at_limit(db, org):
    org.max_agents = 1
    await db.commit()
    await _add_agent(db, org.id)
    with pytest.raises(HTTPException) as exc:
        await UsageService(db).enforce_max_agents(org.id)
    assert exc.value.detail["code"] == ERR_MAX_AGENTS
    assert exc.value.detail["limit"] == 1


# ------------------------------------------------------------------
# max_tokens_per_period
# ------------------------------------------------------------------


async def test_enforce_token_budget_allows_when_unlimited(db, org):
    org.max_tokens_per_period = None
    org.tokens_used_in_period = 99999
    await db.commit()
    await UsageService(db).enforce_token_budget(org.id)


async def test_enforce_token_budget_blocks_when_exceeded(db, org):
    org.max_tokens_per_period = 1000
    org.tokens_used_in_period = 1000
    await db.commit()
    with pytest.raises(HTTPException) as exc:
        await UsageService(db).enforce_token_budget(org.id)
    assert exc.value.detail["code"] == ERR_MAX_TOKENS
    assert exc.value.detail["limit"] == 1000


async def test_record_tokens_bumps_counter(db, org):
    service = UsageService(db)
    await service.record_tokens(org.id, 250)
    await service.record_tokens(org.id, 50)
    snap = await service.get_snapshot(org.id)
    assert snap.tokens_used_in_period == 300


async def test_rollover_resets_counter_when_period_elapsed(db, org):
    # Pretend the current period started 35 days ago (monthly rollover).
    org.token_period_start = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None) - dt.timedelta(days=35)
    org.tokens_used_in_period = 500
    await db.commit()
    snap = await UsageService(db).get_snapshot(org.id)
    assert snap.tokens_used_in_period == 0


async def test_suspended_org_blocks_all_enforcement(db, org):
    org.is_suspended = True
    org.max_users = None
    org.max_agents = None
    org.max_tokens_per_period = None
    await db.commit()
    service = UsageService(db)

    with pytest.raises(HTTPException) as exc:
        await service.enforce_max_users(org.id)
    assert exc.value.detail["code"] == ERR_ORG_SUSPENDED

    with pytest.raises(HTTPException) as exc:
        await service.enforce_max_agents(org.id)
    assert exc.value.detail["code"] == ERR_ORG_SUSPENDED

    with pytest.raises(HTTPException) as exc:
        await service.enforce_token_budget(org.id)
    assert exc.value.detail["code"] == ERR_ORG_SUSPENDED


# ------------------------------------------------------------------
# update_limits
# ------------------------------------------------------------------


async def test_update_limits_sets_and_clears(db, org):
    service = UsageService(db)
    await service.update_limits(org.id, max_users=5, max_agents=3)
    snap = await service.get_snapshot(org.id)
    assert snap.max_users == 5
    assert snap.max_agents == 3

    await service.update_limits(org.id, clear_max_users=True)
    snap = await service.get_snapshot(org.id)
    assert snap.max_users is None
    assert snap.max_agents == 3
