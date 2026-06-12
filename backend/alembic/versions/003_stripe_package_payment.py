"""stripe package payment

Revision ID: 003
Revises: f98a7118c011
Create Date: 2026-06-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, Sequence[str], None] = 'f98a7118c011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Stripe Payment Link columns to student_packages table."""
    with op.batch_alter_table('student_packages') as batch_op:
        batch_op.add_column(sa.Column('stripe_payment_link_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('stripe_payment_link_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('stripe_session_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('payment_method', sa.String(), server_default='manual', nullable=True))


def downgrade() -> None:
    """Remove Stripe Payment Link columns from student_packages."""
    with op.batch_alter_table('student_packages') as batch_op:
        batch_op.drop_column('payment_method')
        batch_op.drop_column('stripe_session_id')
        batch_op.drop_column('stripe_payment_link_url')
        batch_op.drop_column('stripe_payment_link_id')
