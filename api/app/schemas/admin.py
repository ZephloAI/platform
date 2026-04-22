"""
Pydantic schemas for the admin dashboard API and customer usage view.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UsageSnapshotResponse(BaseModel):
    """What the customer dashboard renders on the billing/settings page."""

    organization_id: int
    plan: str
    is_suspended: bool
    users_count: int
    agents_count: int
    tokens_used_in_period: int
    max_users: int | None = None
    max_agents: int | None = None
    max_tokens_per_period: int | None = None
    token_period: str
    token_period_start: datetime | None = None


class OrgAdminSummary(BaseModel):
    """One row in the admin "list all orgs" view."""

    id: int
    name: str
    slug: str
    plan: str
    is_suspended: bool
    created_at: datetime
    users_count: int
    agents_count: int
    tokens_used_in_period: int
    max_users: int | None = None
    max_agents: int | None = None
    max_tokens_per_period: int | None = None
    token_period: str
    token_period_start: datetime | None = None


class UpdateLimitsRequest(BaseModel):
    """Admin: edit an org's limits. Null means don't touch;
    `clear_*` flags explicitly unset a limit (back to unlimited)."""

    plan: str | None = None
    max_users: int | None = None
    max_agents: int | None = None
    max_tokens_per_period: int | None = None
    token_period: str | None = None
    clear_max_users: bool = False
    clear_max_agents: bool = False
    clear_max_tokens: bool = False


class SuspendRequest(BaseModel):
    suspended: bool


class AuditLogEntry(BaseModel):
    id: int
    organization_id: int | None
    actor_user_id: int | None
    action: str
    target_type: str | None
    target_id: str | None
    extra: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlatformMetricsResponse(BaseModel):
    active_orgs: int
    suspended_orgs: int
    total_orgs: int
    total_agents: int
    total_users: int
    tokens_last_30_days: int


class TokenUsagePoint(BaseModel):
    date: str
    total_tokens: int


class PlatformTokenTimeseries(BaseModel):
    points: list[TokenUsagePoint]
