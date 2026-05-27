"""
Admin dashboard router.

All endpoints require is_platform_admin=True on the JWT user. Provides
the platform admin with visibility into every organization's usage,
tools to adjust limits, and platform-wide metrics.
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import cast, Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_platform_admin
from app.models.agent_token_usage import AgentTokenUsage
from app.models.chatbot import Chatbot
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.schemas.admin import (
    AdminAgentSummary,
    AuditLogEntry,
    OrgAdminSummary,
    PlatformMetricsResponse,
    PlatformTokenTimeseries,
    SuspendRequest,
    TokenUsagePoint,
    UpdateAgentModelRequest,
    UpdateLimitsRequest,
)
from app.services.audit_service import AuditLogService
from app.services.usage_service import UsageService

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_platform_admin)],
)


# ---------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------


@router.get("/organizations", response_model=list[OrgAdminSummary])
async def list_organizations(db: AsyncSession = Depends(get_db)):
    """List every organization with its headline stats."""
    orgs = (await db.execute(select(Organization))).scalars().all()

    users_rows = (
        await db.execute(
            select(
                OrganizationMember.organization_id,
                func.count(OrganizationMember.id),
            ).group_by(OrganizationMember.organization_id)
        )
    ).all()
    users_map = {row[0]: row[1] for row in users_rows}

    agents_rows = (
        await db.execute(
            select(Chatbot.organization_id, func.count(Chatbot.id))
            .where(Chatbot.organization_id.is_not(None))
            .group_by(Chatbot.organization_id)
        )
    ).all()
    agents_map = {row[0]: row[1] for row in agents_rows}

    return [
        OrgAdminSummary(
            id=org.id,
            name=org.name,
            slug=org.slug,
            plan=org.plan,
            is_suspended=org.is_suspended,
            created_at=org.created_at,
            users_count=users_map.get(org.id, 0),
            agents_count=agents_map.get(org.id, 0),
            tokens_used_in_period=org.tokens_used_in_period or 0,
            max_users=org.max_users,
            max_agents=org.max_agents,
            max_tokens_per_period=org.max_tokens_per_period,
            token_period=org.token_period,
            token_period_start=org.token_period_start,
        )
        for org in orgs
    ]


@router.get("/organizations/{org_id}", response_model=OrgAdminSummary)
async def get_organization(org_id: int, db: AsyncSession = Depends(get_db)):
    snapshot = await UsageService(db).get_snapshot(org_id)
    org = await db.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return OrgAdminSummary(
        id=org.id,
        name=org.name,
        slug=org.slug,
        plan=org.plan,
        is_suspended=org.is_suspended,
        created_at=org.created_at,
        users_count=snapshot.users_count,
        agents_count=snapshot.agents_count,
        tokens_used_in_period=snapshot.tokens_used_in_period,
        max_users=snapshot.max_users,
        max_agents=snapshot.max_agents,
        max_tokens_per_period=snapshot.max_tokens_per_period,
        token_period=snapshot.token_period,
        token_period_start=snapshot.token_period_start,
    )


@router.put("/organizations/{org_id}/limits", response_model=OrgAdminSummary)
async def update_limits(
    org_id: int,
    body: UpdateLimitsRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    service = UsageService(db)
    org = await service.update_limits(
        org_id,
        plan=body.plan,
        max_users=body.max_users,
        max_agents=body.max_agents,
        max_tokens_per_period=body.max_tokens_per_period,
        token_period=body.token_period,
        clear_max_users=body.clear_max_users,
        clear_max_agents=body.clear_max_agents,
        clear_max_tokens=body.clear_max_tokens,
    )
    await AuditLogService(db).record(
        action="limits.updated",
        organization_id=org_id,
        actor_user_id=admin.id,
        target_type="organization",
        target_id=str(org_id),
        extra=body.model_dump(exclude_none=True),
    )
    return await get_organization(org_id, db)


@router.post("/organizations/{org_id}/suspend", response_model=OrgAdminSummary)
async def suspend_organization(
    org_id: int,
    body: SuspendRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    service = UsageService(db)
    await service.set_suspended(org_id, body.suspended)
    await AuditLogService(db).record(
        action="org.suspended" if body.suspended else "org.reactivated",
        organization_id=org_id,
        actor_user_id=admin.id,
        target_type="organization",
        target_id=str(org_id),
    )
    return await get_organization(org_id, db)


@router.get(
    "/organizations/{org_id}/audit-log", response_model=list[AuditLogEntry]
)
async def get_audit_log(
    org_id: int,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    rows = await AuditLogService(db).list_for_org(org_id, limit=limit)
    return [AuditLogEntry.model_validate(r) for r in rows]


# ---------------------------------------------------------------------
# Per-agent model
# ---------------------------------------------------------------------


@router.get(
    "/organizations/{org_id}/agents", response_model=list[AdminAgentSummary]
)
async def list_org_agents(org_id: int, db: AsyncSession = Depends(get_db)):
    """List an org's agents with the model each one uses."""
    agents = (
        await db.execute(
            select(Chatbot)
            .where(Chatbot.organization_id == org_id)
            .order_by(Chatbot.name)
        )
    ).scalars().all()
    return [AdminAgentSummary.model_validate(a) for a in agents]


@router.put("/agents/{agent_id}/model", response_model=AdminAgentSummary)
async def update_agent_model(
    agent_id: str,
    body: UpdateAgentModelRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_platform_admin),
):
    """Set an agent's LLM model. Blank resets it to the global default.

    agent_id is the public UUID. The new model applies to the agent's
    next chat session.
    """
    chatbot = (
        await db.execute(
            select(Chatbot).where(Chatbot.public_id == agent_id)
        )
    ).scalar_one_or_none()
    if chatbot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    # Treat blank input as "use the default" (NULL).
    model = (body.llm_model or "").strip() or None
    chatbot.llm_model = model
    await db.commit()
    await db.refresh(chatbot)

    await AuditLogService(db).record(
        action="agent.model_updated",
        organization_id=chatbot.organization_id,
        actor_user_id=admin.id,
        target_type="chatbot",
        target_id=agent_id,
        extra={"llm_model": model},
    )
    return AdminAgentSummary.model_validate(chatbot)


# ---------------------------------------------------------------------
# Platform-wide metrics
# ---------------------------------------------------------------------


@router.get("/metrics", response_model=PlatformMetricsResponse)
async def platform_metrics(db: AsyncSession = Depends(get_db)):
    total_orgs = (await db.execute(select(func.count(Organization.id)))).scalar() or 0
    suspended = (
        await db.execute(
            select(func.count(Organization.id)).where(
                Organization.is_suspended.is_(True)
            )
        )
    ).scalar() or 0
    total_agents = (await db.execute(select(func.count(Chatbot.id)))).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0

    thirty_days_ago = date.today() - timedelta(days=30)
    tokens_last_30 = (
        await db.execute(
            select(func.coalesce(func.sum(AgentTokenUsage.total_tokens), 0)).where(
                cast(AgentTokenUsage.created_at, Date) >= thirty_days_ago
            )
        )
    ).scalar() or 0

    return PlatformMetricsResponse(
        active_orgs=total_orgs - suspended,
        suspended_orgs=suspended,
        total_orgs=total_orgs,
        total_agents=total_agents,
        total_users=total_users,
        tokens_last_30_days=int(tokens_last_30),
    )


@router.get("/metrics/tokens", response_model=PlatformTokenTimeseries)
async def platform_token_timeseries(
    days: int = 30, db: AsyncSession = Depends(get_db)
):
    """Platform-wide token usage per day for charting."""
    today = date.today()
    start = today - timedelta(days=days - 1)

    rows = (
        await db.execute(
            select(
                cast(AgentTokenUsage.created_at, Date).label("day"),
                func.coalesce(func.sum(AgentTokenUsage.total_tokens), 0).label(
                    "total"
                ),
            )
            .where(cast(AgentTokenUsage.created_at, Date) >= start)
            .group_by("day")
        )
    ).all()
    by_day = {str(r.day): int(r.total) for r in rows}

    points = [
        TokenUsagePoint(
            date=(start + timedelta(days=i)).isoformat(),
            total_tokens=by_day.get((start + timedelta(days=i)).isoformat(), 0),
        )
        for i in range(days)
    ]
    return PlatformTokenTimeseries(points=points)
