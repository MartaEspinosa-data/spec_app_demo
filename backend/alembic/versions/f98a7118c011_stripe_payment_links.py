"""stripe_payment_links

Revision ID: f98a7118c011
Revises: 002
Create Date: 2026-05-27 21:36:28.204161

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f98a7118c011'
down_revision: Union[str, Sequence[str], None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — add Stripe Payment Link columns."""
    op.add_column('lessons', sa.Column('stripe_payment_link_id', sa.String(), nullable=True))
    op.add_column('lessons', sa.Column('stripe_payment_link_url', sa.String(), nullable=True))
    op.add_column('lessons', sa.Column('stripe_session_id', sa.String(), nullable=True))
    op.add_column('lessons', sa.Column('payment_method', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema — remove Stripe Payment Link columns."""
    op.drop_column('lessons', 'payment_method')
    op.drop_column('lessons', 'stripe_session_id')
    op.drop_column('lessons', 'stripe_payment_link_url')
    op.drop_column('lessons', 'stripe_payment_link_id')
