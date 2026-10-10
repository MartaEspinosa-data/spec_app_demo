"""student email verification

Revision ID: 005
Revises: 004, f98a7118c011
Create Date: 2026-10-10

Also merges the two previous heads (004 and f98a7118c011) into a single head.
Existing students who already have a usable login (password or Google) are
grandfathered in as verified so nobody is locked out by this change.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, Sequence[str], None] = ('004', 'f98a7118c011')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add email verification columns to students."""
    with op.batch_alter_table('students') as batch_op:
        batch_op.add_column(sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column('verification_token', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('verification_token_expiry', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index(batch_op.f('ix_students_verification_token'), ['verification_token'], unique=False)

    # Grandfather existing accounts that can already log in
    students = sa.table(
        'students',
        sa.column('email_verified', sa.Boolean()),
        sa.column('password_hash', sa.String()),
        sa.column('google_id', sa.String()),
    )
    op.execute(
        students.update()
        .where(sa.or_(students.c.password_hash.isnot(None), students.c.google_id.isnot(None)))
        .values(email_verified=True)
    )


def downgrade() -> None:
    """Remove email verification columns."""
    with op.batch_alter_table('students') as batch_op:
        batch_op.drop_index(batch_op.f('ix_students_verification_token'))
        batch_op.drop_column('verification_token_expiry')
        batch_op.drop_column('verification_token')
        batch_op.drop_column('email_verified')
