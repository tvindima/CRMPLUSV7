"""add portal export tables

Revision ID: 20260218_portal_exports
Revises: b98146b79283
Create Date: 2026-02-18
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260218_portal_exports"
down_revision = "b98146b79283"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "portal_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("mode", sa.String(length=20), nullable=False, server_default="feed"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("feed_token", sa.String(length=120), nullable=True),
        sa.Column("credentials_json", sa.JSON(), nullable=True),
        sa.Column("settings_json", sa.JSON(), nullable=True),
        sa.Column("last_validated_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", name="uq_portal_accounts_provider"),
        sa.UniqueConstraint("feed_token"),
    )
    op.create_index(op.f("ix_portal_accounts_id"), "portal_accounts", ["id"], unique=False)
    op.create_index(op.f("ix_portal_accounts_provider"), "portal_accounts", ["provider"], unique=False)
    op.create_index(op.f("ix_portal_accounts_feed_token"), "portal_accounts", ["feed_token"], unique=True)

    op.create_table(
        "portal_listings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("external_listing_id", sa.String(length=120), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("last_payload_json", sa.JSON(), nullable=True),
        sa.Column("last_response_json", sa.JSON(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("property_id", "provider", name="uq_portal_listings_property_provider"),
    )
    op.create_index(op.f("ix_portal_listings_id"), "portal_listings", ["id"], unique=False)
    op.create_index(op.f("ix_portal_listings_property_id"), "portal_listings", ["property_id"], unique=False)
    op.create_index(op.f("ix_portal_listings_provider"), "portal_listings", ["provider"], unique=False)

    op.create_table(
        "portal_sync_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_portal_sync_jobs_id"), "portal_sync_jobs", ["id"], unique=False)
    op.create_index(op.f("ix_portal_sync_jobs_property_id"), "portal_sync_jobs", ["property_id"], unique=False)
    op.create_index(op.f("ix_portal_sync_jobs_provider"), "portal_sync_jobs", ["provider"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_portal_sync_jobs_provider"), table_name="portal_sync_jobs")
    op.drop_index(op.f("ix_portal_sync_jobs_property_id"), table_name="portal_sync_jobs")
    op.drop_index(op.f("ix_portal_sync_jobs_id"), table_name="portal_sync_jobs")
    op.drop_table("portal_sync_jobs")

    op.drop_index(op.f("ix_portal_listings_provider"), table_name="portal_listings")
    op.drop_index(op.f("ix_portal_listings_property_id"), table_name="portal_listings")
    op.drop_index(op.f("ix_portal_listings_id"), table_name="portal_listings")
    op.drop_table("portal_listings")

    op.drop_index(op.f("ix_portal_accounts_feed_token"), table_name="portal_accounts")
    op.drop_index(op.f("ix_portal_accounts_provider"), table_name="portal_accounts")
    op.drop_index(op.f("ix_portal_accounts_id"), table_name="portal_accounts")
    op.drop_table("portal_accounts")

