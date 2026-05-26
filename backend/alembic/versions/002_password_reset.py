"""password reset support

Revision ID: 002
Revises: daa96a4ae66c
Create Date: 2026-05-25

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, Sequence[str], None] = 'daa96a4ae66c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add password reset columns to students and teachers."""
    # Students: reset_token and reset_token_expiry
    with op.batch_alter_table('students') as batch_op:
        batch_op.add_column(sa.Column('reset_token', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('reset_token_expiry', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index(batch_op.f('ix_students_reset_token'), ['reset_token'], unique=False)

    # Teachers: password_hash, reset_token, and reset_token_expiry
    with op.batch_alter_table('teachers') as batch_op:
        batch_op.add_column(sa.Column('password_hash', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('reset_token', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('reset_token_expiry', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index(batch_op.f('ix_teachers_reset_token'), ['reset_token'], unique=False)


def downgrade() -> None:
    """Remove password reset columns."""
    with op.batch_alter_table('teachers') as batch_op:
        batch_op.drop_index(batch_op.f('ix_teachers_reset_token'))
        batch_op.drop_column('reset_token_expiry')
        batch_op.drop_column('reset_token')
        batch_op.drop_column('password_hash')

    with op.batch_alter_table('students') as batch_op:
        batch_op.drop_index(batch_op.f('ix_students_reset_token'))
        batch_op.drop_column('reset_token_expiry')
        batch_op.drop_column('reset_token')
