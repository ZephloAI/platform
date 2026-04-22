"""
Usage + limit enforcement service.

Responsibilities:
- Resolve per-organization limits (max_users, max_agents, max_tokens_per_period).
- Roll over the token usage period (monthly by default).
- Enforce limits with structured errors the frontend can surface.
- Provide a cheap incremental counter bump used by the agent service
  when it records token usage, so admin reads never scan the raw rows.

Structured errors use HTTP 402 (Payment Required) with a JSON detail
containing ``code``, ``message``, and ``limit`` so the frontend can
detect which limit tripped without parsing free text.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chatbot import Chatbot
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember


# Error codes the frontend switches on. Keep them stable.
ERR_MAX_USERS = "limit_max_users_exceeded"
ERR_MAX_AGENTS = "limit_max_agents_exceeded"
ERR_MAX_TOKENS = "limit_max_tokens_exceeded"
ERR_ORG_SUSPENDED = "organization_suspended"


@dataclass
class UsageSnapshot:
    organization_id: int
    plan: str
    is_suspended: bool
    users_count: int
    agents_count: int
    tokens_used_in_period: int
    max_users: int | None
    max_agents: int | None
    max_tokens_per_period: int | None
    token_period: str
    token_period_start: datetime | None


def _limit_error(code: str, message: str, limit: int | None) -> HTTPException:
    """Raise a 402-style structured error the frontend can surface."""
    return HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail={"code": code, "message": message, "limit": limit},
    )


def _period_length(token_period: str) -> timedelta:
    """How long a single usage period lasts. Monthly is approximated as 30 days."""
    if token_period == "weekly":
        return timedelta(days=7)
    if token_period == "daily":
        return timedelta(days=1)
    return timedelta(days=30)


class UsageService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # -- internal helpers --

    async def _get_org(self, org_id: int) -> Organization:
        org = await self.db.get(Organization, org_id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )
        return org

    async def _users_count(self, org_id: int) -> int:
        result = await self.db.execute(
            select(func.count(OrganizationMember.id)).where(
                OrganizationMember.organization_id == org_id
            )
        )
        return int(result.scalar() or 0)

    async def _agents_count(self, org_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Chatbot.id)).where(Chatbot.organization_id == org_id)
        )
        return int(result.scalar() or 0)

    async def _rollover_if_needed(self, org: Organization) -> Organization:
        """Reset the period counter when the current period has elapsed."""
        now = datetime.now(timezone.utc)
        start = org.token_period_start
        if start is None:
            org.token_period_start = now
            await self.db.commit()
            await self.db.refresh(org)
            return org

        # SQLAlchemy returns naive datetimes from Postgres when the column is
        # DateTime (no tz). Compare naive-to-naive.
        start_naive = start.replace(tzinfo=None) if start.tzinfo else start
        now_naive = now.replace(tzinfo=None)
        if now_naive - start_naive >= _period_length(org.token_period):
            org.token_period_start = now_naive
            org.tokens_used_in_period = 0
            await self.db.commit()
            await self.db.refresh(org)
        return org

    # -- public API --

    async def get_snapshot(self, org_id: int) -> UsageSnapshot:
        """Return the current usage + limits for an organization."""
        org = await self._rollover_if_needed(await self._get_org(org_id))
        users = await self._users_count(org_id)
        agents = await self._agents_count(org_id)
        return UsageSnapshot(
            organization_id=org.id,
            plan=org.plan,
            is_suspended=org.is_suspended,
            users_count=users,
            agents_count=agents,
            tokens_used_in_period=org.tokens_used_in_period or 0,
            max_users=org.max_users,
            max_agents=org.max_agents,
            max_tokens_per_period=org.max_tokens_per_period,
            token_period=org.token_period,
            token_period_start=org.token_period_start,
        )

    async def assert_not_suspended(self, org_id: int) -> Organization:
        org = await self._get_org(org_id)
        if org.is_suspended:
            raise _limit_error(
                ERR_ORG_SUSPENDED,
                "This organization is suspended. Contact support.",
                None,
            )
        return org

    async def enforce_max_users(self, org_id: int) -> None:
        """Call BEFORE adding a new member (e.g. on invite acceptance)."""
        org = await self.assert_not_suspended(org_id)
        if org.max_users is None:
            return
        current = await self._users_count(org_id)
        if current >= org.max_users:
            raise _limit_error(
                ERR_MAX_USERS,
                f"This organization has reached its user limit ({org.max_users}).",
                org.max_users,
            )

    async def enforce_max_agents(self, org_id: int) -> None:
        """Call BEFORE creating a new Agent."""
        org = await self.assert_not_suspended(org_id)
        if org.max_agents is None:
            return
        current = await self._agents_count(org_id)
        if current >= org.max_agents:
            raise _limit_error(
                ERR_MAX_AGENTS,
                f"This organization has reached its Agent limit ({org.max_agents}).",
                org.max_agents,
            )

    async def enforce_token_budget(self, org_id: int) -> None:
        """Call BEFORE running the LLM so we reject once the budget is spent."""
        org = await self._rollover_if_needed(await self._get_org(org_id))
        if org.is_suspended:
            raise _limit_error(
                ERR_ORG_SUSPENDED,
                "This organization is suspended. Contact support.",
                None,
            )
        if org.max_tokens_per_period is None:
            return
        if (org.tokens_used_in_period or 0) >= org.max_tokens_per_period:
            raise _limit_error(
                ERR_MAX_TOKENS,
                "Token budget for this period has been exhausted.",
                org.max_tokens_per_period,
            )

    async def record_tokens(self, org_id: int, total_tokens: int) -> None:
        """
        Bump the per-organization counter atomically.

        Called AFTER an LLM run completes. The raw row in `agent_token_usage`
        is inserted by the agent service; this keeps the admin-read counter
        cheap by avoiding aggregation queries on every read.
        """
        if total_tokens <= 0:
            return
        # Handle rollover before the increment so a late call right after
        # the period boundary lands in the new period.
        await self._rollover_if_needed(await self._get_org(org_id))
        await self.db.execute(
            update(Organization)
            .where(Organization.id == org_id)
            .values(
                tokens_used_in_period=(
                    Organization.tokens_used_in_period + total_tokens
                )
            )
        )
        await self.db.commit()

    async def update_limits(
        self,
        org_id: int,
        *,
        plan: str | None = None,
        max_users: int | None = None,
        max_agents: int | None = None,
        max_tokens_per_period: int | None = None,
        token_period: str | None = None,
        clear_max_users: bool = False,
        clear_max_agents: bool = False,
        clear_max_tokens: bool = False,
    ) -> Organization:
        """Admin-only: mutate the limit columns. ``clear_*`` flags unset a limit."""
        org = await self._get_org(org_id)
        if plan is not None:
            org.plan = plan
        if token_period is not None:
            if token_period not in ("monthly", "weekly", "daily"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="token_period must be monthly, weekly or daily",
                )
            org.token_period = token_period
        if clear_max_users:
            org.max_users = None
        elif max_users is not None:
            org.max_users = max_users
        if clear_max_agents:
            org.max_agents = None
        elif max_agents is not None:
            org.max_agents = max_agents
        if clear_max_tokens:
            org.max_tokens_per_period = None
        elif max_tokens_per_period is not None:
            org.max_tokens_per_period = max_tokens_per_period
        await self.db.commit()
        await self.db.refresh(org)
        return org

    async def set_suspended(self, org_id: int, suspended: bool) -> Organization:
        org = await self._get_org(org_id)
        org.is_suspended = suspended
        await self.db.commit()
        await self.db.refresh(org)
        return org
