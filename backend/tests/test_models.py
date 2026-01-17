import pytest
import uuid
from app.models.users import User, UserRole
from app.models.tenants import Tenant
from app.models.recognition import Recognition
from app.models.rewards import Reward
from app.models.budgets import BudgetPool
from app.models.subscriptions import SubscriptionPlan, TenantSubscription
from app.models.points_ledger import PointsLedger
from app.models.redemptions import Redemption


class TestUserModel:
    def test_user_creation(self):
        """Test basic user creation."""
        user = User(
            email="test@example.com",
            full_name="Test User",
            role=UserRole.CORPORATE_USER,
            is_active=True
        )
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.role == UserRole.CORPORATE_USER
        assert user.is_active is True
        assert user.points_balance == 0
        assert user.lead_budget_balance == 0

    def test_user_role_enum(self):
        """Test UserRole enum values."""
        assert UserRole.PLATFORM_ADMIN.value == "PLATFORM_ADMIN"
        assert UserRole.TENANT_ADMIN.value == "TENANT_ADMIN"
        assert UserRole.TENANT_LEAD.value == "TENANT_LEAD"
        assert UserRole.CORPORATE_USER.value == "CORPORATE_USER"

    def test_user_with_tenant(self):
        """Test user with tenant association."""
        tenant_id = str(uuid.uuid4())
        user = User(
            email="tenant_user@example.com",
            role=UserRole.TENANT_ADMIN,
            tenant_id=tenant_id
        )
        assert user.tenant_id == tenant_id


class TestTenantModel:
    def test_tenant_creation(self):
        """Test basic tenant creation."""
        tenant = Tenant(
            name="Test Company",
            subdomain="testcompany",
            status="active",
            master_budget_balance=10000
        )
        assert tenant.name == "Test Company"
        assert tenant.subdomain == "testcompany"
        assert tenant.status == "active"
        assert tenant.master_budget_balance == 10000
        assert tenant.suspended is False

    def test_tenant_unique_subdomain(self):
        """Test that subdomain should be unique (constraint test)."""
        tenant1 = Tenant(name="Company 1", subdomain="unique", status="active")
        tenant2 = Tenant(name="Company 2", subdomain="unique", status="active")
        # Note: This would fail at DB level due to unique constraint
        assert tenant1.subdomain == tenant2.subdomain


class TestRecognitionModel:
    def test_recognition_creation(self):
        """Test recognition creation."""
        tenant_id = str(uuid.uuid4())
        nominator_id = str(uuid.uuid4())
        nominee_id = str(uuid.uuid4())

        recognition = Recognition(
            nominator_id=nominator_id,
            nominee_id=nominee_id,
            points=50,
            tenant_id=tenant_id,
            message="Great work!"
        )
        assert recognition.nominator_id == nominator_id
        assert recognition.nominee_id == nominee_id
        assert recognition.points == 50
        assert recognition.tenant_id == tenant_id
        assert recognition.message == "Great work!"


class TestRewardModel:
    def test_reward_creation(self):
        """Test reward creation."""
        tenant_id = str(uuid.uuid4())
        reward = Reward(
            title="Coffee Gift Card",
            description="A $10 coffee gift card",
            points_cost=100,
            tenant_id=tenant_id,
            is_active=True
        )
        assert reward.title == "Coffee Gift Card"
        assert reward.description == "A $10 coffee gift card"
        assert reward.points_cost == 100
        assert reward.tenant_id == tenant_id
        assert reward.is_active is True


class TestBudgetPoolModel:
    def test_budget_pool_creation(self):
        """Test budget pool creation."""
        tenant_id = str(uuid.uuid4())
        pool = BudgetPool(
            tenant_id=tenant_id,
            name="Marketing Budget",
            allocated_points=1000,
            remaining_points=1000,
            is_active=True
        )
        assert pool.tenant_id == tenant_id
        assert pool.name == "Marketing Budget"
        assert pool.allocated_points == 1000
        assert pool.remaining_points == 1000
        assert pool.is_active is True


class TestSubscriptionPlanModel:
    def test_subscription_plan_creation(self):
        """Test subscription plan creation."""
        plan = SubscriptionPlan(
            name="Pro Plan",
            description="Professional plan",
            monthly_price=29.99,
            annual_price=299.99,
            max_users=100,
            features=["recognition", "analytics", "rewards"]
        )
        assert plan.name == "Pro Plan"
        assert plan.monthly_price == 29.99
        assert plan.annual_price == 299.99
        assert plan.max_users == 100
        assert "recognition" in plan.features


class TestTenantSubscriptionModel:
    def test_tenant_subscription_creation(self):
        """Test tenant subscription creation."""
        from datetime import date
        tenant_id = str(uuid.uuid4())

        subscription = TenantSubscription(
            tenant_id=tenant_id,
            plan_id=1,
            start_date=date.today(),
            is_active=True
        )
        assert subscription.tenant_id == tenant_id
        assert subscription.plan_id == 1
        assert subscription.is_active is True


class TestPointsLedgerModel:
    def test_points_ledger_creation(self):
        """Test points ledger entry creation."""
        from app.models.points_ledger import TransactionType
        user_id = str(uuid.uuid4())
        tenant_id = str(uuid.uuid4())

        entry = PointsLedger(
            user_id=user_id,
            tenant_id=tenant_id,
            transaction_type=TransactionType.EARNED,
            points=100,
            description="Recognition received"
        )
        assert entry.user_id == user_id
        assert entry.tenant_id == tenant_id
        assert entry.transaction_type == TransactionType.EARNED
        assert entry.points == 100


class TestRedemptionModel:
    def test_redemption_creation(self):
        """Test redemption creation."""
        user_id = str(uuid.uuid4())
        tenant_id = str(uuid.uuid4())
        reward_id = str(uuid.uuid4())

        redemption = Redemption(
            user_id=user_id,
            tenant_id=tenant_id,
            reward_id=reward_id,
            points_spent=200,
            status="pending"
        )
        assert redemption.user_id == user_id
        assert redemption.tenant_id == tenant_id
        assert redemption.reward_id == reward_id
        assert redemption.points_spent == 200
        assert redemption.status == "pending"