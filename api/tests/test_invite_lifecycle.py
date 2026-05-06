"""
Invite lifecycle tests.

These exercise `OrganizationService` invite methods (create, resend, preview,
accept, expire) against a hand-rolled in-memory fake for the repositories.
That keeps the tests fast and DB-free while still covering the branching we
care about: expiry, status transitions, audit rows, and the Resend send.

The Resend client itself is patched so no network call is made.
"""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.services import organization_service as org_service_module


# ---------------------------------------------------------------------------
# In-memory fakes
# ---------------------------------------------------------------------------


class FakeInvitation(SimpleNamespace):
    pass


class FakeMember(SimpleNamespace):
    pass


class FakeOrg(SimpleNamespace):
    pass


class FakeUser(SimpleNamespace):
    pass


class FakeInviteRepo:
    def __init__(self):
        self._by_id: dict[int, FakeInvitation] = {}
        self._next_id = 1

    async def create(self, **kwargs) -> FakeInvitation:
        inv = FakeInvitation(id=self._next_id, **kwargs)
        self._by_id[inv.id] = inv
        self._next_id += 1
        return inv

    async def update(self, invitation_id: int, **kwargs) -> FakeInvitation:
        inv = self._by_id[invitation_id]
        for k, v in kwargs.items():
            setattr(inv, k, v)
        return inv

    async def get_by_id(self, invitation_id: int) -> FakeInvitation | None:
        return self._by_id.get(invitation_id)

    async def get_by_token(self, token: str) -> FakeInvitation | None:
        for inv in self._by_id.values():
            if inv.token == token:
                return inv
        return None

    async def get_pending_for_org(self, org_id: int):
        return [
            inv
            for inv in self._by_id.values()
            if inv.organization_id == org_id and inv.status == "pending"
        ]

    async def delete(self, invitation_id: int) -> bool:
        return self._by_id.pop(invitation_id, None) is not None


class FakeOrgRepo:
    def __init__(self, org: FakeOrg, admin_user_id: int):
        self._org = org
        self._members: dict[tuple[int, int], FakeMember] = {
            (org.id, admin_user_id): FakeMember(
                id=1,
                organization_id=org.id,
                user_id=admin_user_id,
                role="creator",
            )
        }
        self._next_member_id = 2

    async def get_by_id(self, org_id: int) -> FakeOrg | None:
        return self._org if self._org.id == org_id else None

    async def get_member(self, org_id: int, user_id: int) -> FakeMember | None:
        return self._members.get((org_id, user_id))

    async def add_member(self, org_id: int, user_id: int, role: str = "member"):
        member = FakeMember(
            id=self._next_member_id,
            organization_id=org_id,
            user_id=user_id,
            role=role,
        )
        self._next_member_id += 1
        self._members[(org_id, user_id)] = member
        return member


class FakeAuditService:
    """Stand-in for AuditLogService used in OrganizationService."""

    def __init__(self):
        self.entries: list[dict] = []

    async def record(
        self,
        *,
        action: str,
        organization_id: int | None = None,
        actor_user_id: int | None = None,
        target_type: str | None = None,
        target_id: str | None = None,
        extra: dict | None = None,
    ):
        entry = {
            "action": action,
            "organization_id": organization_id,
            "actor_user_id": actor_user_id,
            "target_type": target_type,
            "target_id": target_id,
            "extra": extra or {},
        }
        self.entries.append(entry)
        return entry


class FakeUserRepo:
    def __init__(self, users: dict[int, FakeUser]):
        self._users = users

    async def get_by_id(self, user_id: int) -> FakeUser | None:
        return self._users.get(user_id)


# ---------------------------------------------------------------------------
# Service factory
# ---------------------------------------------------------------------------


@pytest.fixture
def service(monkeypatch):
    """Build an OrganizationService with all repositories stubbed."""
    org = FakeOrg(id=100, name="Acme", slug="acme", created_at=datetime.now(timezone.utc))
    admin = FakeUser(
        id=1, email="admin@acme.test", onboarding_completed=True
    )
    invitee = FakeUser(id=2, email="invitee@acme.test", onboarding_completed=False)

    invite_repo = FakeInviteRepo()
    org_repo = FakeOrgRepo(org, admin_user_id=admin.id)
    audit = FakeAuditService()
    users = {admin.id: admin, invitee.id: invitee}

    # Fake db stub: accept_invitation eventually calls `self.db.commit()` after
    # toggling the user's onboarding flag. Anything else goes through our repos.
    class FakeDB:
        async def commit(self):
            return None

    svc = org_service_module.OrganizationService(db=FakeDB())  # type: ignore[arg-type]
    svc.invite_repo = invite_repo  # type: ignore[assignment]
    svc.org_repo = org_repo  # type: ignore[assignment]
    svc.audit = audit  # type: ignore[assignment]

    # accept_invitation calls UsageService(db).enforce_max_users. That hits
    # the real ORM, which has no tables in this DB-less test. Patch it to a
    # no-op so the invite-lifecycle tests stay focused on invite state.
    async def _allow_all_users(org_id):
        return None

    class FakeUsageService:
        def __init__(self, db):
            pass

        enforce_max_users = staticmethod(_allow_all_users)
        enforce_seat_available_for_invite = staticmethod(_allow_all_users)

    monkeypatch.setattr(
        org_service_module, "UsageService", FakeUsageService
    )

    # Replace the resend client with an AsyncMock that pretends to send.
    resend = SimpleNamespace(
        is_configured=True,
        send_email=AsyncMock(return_value={"id": "resend_msg_123"}),
    )
    svc.resend = resend  # type: ignore[assignment]

    # Both `_get_user_email` and the inline UserRepository(...) call during
    # accept() look up users. Stub the UserRepository class to route through
    # our in-memory users dict.
    user_repo_stub = FakeUserRepo(users)
    monkeypatch.setattr(
        org_service_module,
        "UserRepository",
        lambda db: user_repo_stub,
    )

    async def fake_get_user_email(user_id: int):
        return users.get(user_id).email if user_id in users else None

    monkeypatch.setattr(svc, "_get_user_email", fake_get_user_email)

    # Expose helpers on the service so tests can reach the fakes.
    svc.test_admin = admin  # type: ignore[attr-defined]
    svc.test_invitee = invitee  # type: ignore[attr-defined]
    svc.test_org = org  # type: ignore[attr-defined]
    svc.test_audit = audit  # type: ignore[attr-defined]
    svc.test_invite_repo = invite_repo  # type: ignore[attr-defined]
    return svc


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_invite_user_creates_pending_invitation_and_sends_email(service):
    inv = await service.invite_user(
        org_id=service.test_org.id,
        email="Newbie@Example.com",
        role="member",
        invited_by_id=service.test_admin.id,
    )

    # Lowercased + trimmed
    assert inv.email == "newbie@example.com"
    assert inv.status == "pending"
    assert inv.send_count == 1
    assert inv.last_sent_at is not None
    assert inv.expires_at > datetime.now(timezone.utc)

    # One resend send call + one audit row of type invite.sent
    assert service.resend.send_email.await_count == 1
    actions = [e["action"] for e in service.test_audit.entries]
    assert actions == ["invite.sent"]
    assert service.test_audit.entries[0]["target_id"] == str(inv.id)
    assert service.test_audit.entries[0]["extra"]["resend_message_id"] == "resend_msg_123"


@pytest.mark.asyncio
async def test_invite_user_non_admin_forbidden(service):
    # admin is id=1 (creator). A random other user should be rejected.
    with pytest.raises(HTTPException) as exc:
        await service.invite_user(
            org_id=service.test_org.id,
            email="x@y.z",
            role="member",
            invited_by_id=9999,
        )
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_invite_user_rejects_creator_role(service):
    with pytest.raises(HTTPException) as exc:
        await service.invite_user(
            org_id=service.test_org.id,
            email="x@y.z",
            role="creator",
            invited_by_id=service.test_admin.id,
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_resend_invitation_bumps_count_and_extends_expiry(service):
    inv = await service.invite_user(
        org_id=service.test_org.id,
        email="again@example.com",
        role="member",
        invited_by_id=service.test_admin.id,
    )

    # Force the invite to look "old" so we can see expiry extend.
    inv.expires_at = datetime.now(timezone.utc) - timedelta(days=1)

    resent = await service.resend_invitation(
        org_id=service.test_org.id,
        invitation_id=inv.id,
        requesting_user_id=service.test_admin.id,
    )

    assert resent.send_count == 2
    assert resent.status == "pending"
    assert resent.expires_at > datetime.now(timezone.utc)

    # Two sends total (initial + resend), two audit rows.
    assert service.resend.send_email.await_count == 2
    actions = [e["action"] for e in service.test_audit.entries]
    assert actions == ["invite.sent", "invite.resent"]


@pytest.mark.asyncio
async def test_resend_invitation_rejects_accepted(service):
    inv = await service.invite_user(
        org_id=service.test_org.id,
        email="once@example.com",
        role="member",
        invited_by_id=service.test_admin.id,
    )
    inv.status = "accepted"

    with pytest.raises(HTTPException) as exc:
        await service.resend_invitation(
            org_id=service.test_org.id,
            invitation_id=inv.id,
            requesting_user_id=service.test_admin.id,
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_accept_invitation_adds_member_and_fills_accepted_fields(service):
    inv = await service.invite_user(
        org_id=service.test_org.id,
        email=service.test_invitee.email,
        role="member",
        invited_by_id=service.test_admin.id,
    )

    accepted = await service.accept_invitation(
        token=inv.token, user_id=service.test_invitee.id
    )

    assert accepted.status == "accepted"
    assert accepted.accepted_by_user_id == service.test_invitee.id
    assert accepted.accepted_at is not None

    # The invitee should now be a member of the org.
    member = await service.org_repo.get_member(
        service.test_org.id, service.test_invitee.id
    )
    assert member is not None
    assert member.role == "member"

    # Onboarding got auto-completed for the invited user.
    assert service.test_invitee.onboarding_completed is True

    actions = [e["action"] for e in service.test_audit.entries]
    assert "invite.accepted" in actions


@pytest.mark.asyncio
async def test_accept_expired_invitation_marks_expired_and_400s(service):
    inv = await service.invite_user(
        org_id=service.test_org.id,
        email=service.test_invitee.email,
        role="member",
        invited_by_id=service.test_admin.id,
    )
    inv.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)

    with pytest.raises(HTTPException) as exc:
        await service.accept_invitation(
            token=inv.token, user_id=service.test_invitee.id
        )
    assert exc.value.status_code == 400
    assert inv.status == "expired"


@pytest.mark.asyncio
async def test_preview_shows_org_and_inviter(service):
    inv = await service.invite_user(
        org_id=service.test_org.id,
        email="previewed@example.com",
        role="admin",
        invited_by_id=service.test_admin.id,
    )

    preview = await service.get_invitation_preview(inv.token)
    assert preview["organization_name"] == service.test_org.name
    assert preview["inviter_email"] == service.test_admin.email
    assert preview["role"] == "admin"
    assert preview["is_expired"] is False


@pytest.mark.asyncio
async def test_preview_missing_token_404s(service):
    with pytest.raises(HTTPException) as exc:
        await service.get_invitation_preview("nonexistent-token")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_invite_email_failure_does_not_rollback_invitation(service):
    # Resend pretends to fail; the invite should still exist as pending.
    from app.services.resend_client import ResendError

    service.resend.send_email = AsyncMock(side_effect=ResendError("boom"))

    inv = await service.invite_user(
        org_id=service.test_org.id,
        email="flaky@example.com",
        role="member",
        invited_by_id=service.test_admin.id,
    )

    # Still pending, still written to the audit log (with no resend id).
    assert inv.status == "pending"
    assert service.test_audit.entries[-1]["action"] == "invite.sent"
    assert service.test_audit.entries[-1]["extra"]["resend_message_id"] is None
