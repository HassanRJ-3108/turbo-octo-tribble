"""add_storage_provider_to_models_3d

Revision ID: ac3fd64294c4
Revises: c10a454e6181
Create Date: 2026-02-18 14:43:13.335921

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac3fd64294c4'
down_revision: Union[str, None] = 'c10a454e6181'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add column as nullable first
    op.add_column('models_3d', sa.Column('storage_provider', sa.String(length=20), nullable=True))
    # Backfill existing rows with 'supabase'
    op.execute("UPDATE models_3d SET storage_provider = 'supabase' WHERE storage_provider IS NULL")
    # Now make it NOT NULL
    op.alter_column('models_3d', 'storage_provider', nullable=False, server_default='supabase')


def downgrade() -> None:
    op.drop_column('models_3d', 'storage_provider')
