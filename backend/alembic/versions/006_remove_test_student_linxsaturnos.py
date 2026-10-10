"""remove test student linxsaturnos

Revision ID: 006
Revises: 005
Create Date: 2026-10-10

Removes test account linxsaturnos@gmail.com and any associated lessons/packages
from both development and production databases to allow testing new registration
and verification flow.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, Sequence[str], None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # Check for student matching linxsaturnos@gmail.com
    students = conn.execute(
        sa.text("SELECT id FROM students WHERE lower(email) = 'linxsaturnos@gmail.com'")
    ).fetchall()
    
    for row in students:
        sid = row[0]
        # Clean up related records in lessons and student_packages
        conn.execute(sa.text("DELETE FROM lessons WHERE student_id = :sid"), {"sid": str(sid)})
        try:
            conn.execute(sa.text("DELETE FROM student_packages WHERE student_id = :sid"), {"sid": str(sid)})
        except Exception:
            pass
        # Delete student record
        conn.execute(sa.text("DELETE FROM students WHERE id = :sid"), {"sid": str(sid)})


def downgrade() -> None:
    pass
