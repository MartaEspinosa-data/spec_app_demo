"""lesson created_at

Revision ID: 004
Revises: 003
Create Date: 2026-06-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, Sequence[str], None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add created_at column to lessons table."""
    with op.batch_alter_table('lessons') as batch_op:
        batch_op.add_column(
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True)
        )


def downgrade() -> None:
    """Remove created_at column from lessons table."""
    with op.batch_alter_table('lessons') as batch_op:
        batch_op.drop_column('created_at')
