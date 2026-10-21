"""add teacher_reminder_60m_sent and teacher_reminder_30m_sent to lessons

Revision ID: 008
Revises: 007
Create Date: 2026-10-21
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008'
down_revision: Union[str, Sequence[str], None] = '007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('lessons', schema=None) as batch_op:
        batch_op.add_column(sa.Column('teacher_reminder_60m_sent', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('teacher_reminder_30m_sent', sa.Integer(), nullable=True, server_default='0'))


def downgrade() -> None:
    with op.batch_alter_table('lessons', schema=None) as batch_op:
        batch_op.drop_column('teacher_reminder_30m_sent')
        batch_op.drop_column('teacher_reminder_60m_sent')
