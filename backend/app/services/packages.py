from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.lessons import get_lesson_price
from app.models.lesson_package import LessonPackage
from app.models.teacher import Teacher

PACKAGE_SIZE = 5
PACKAGE_DISCOUNT_PERCENT = 3.0

def calculate_package_pricing(
    lesson_type: str,
    duration: int,
    teacher: Optional[Teacher] = None,
) -> Dict[str, Any]:
    teacher_pricing_schema = teacher.pricing_schema if teacher else None
    teacher_hourly_rate = teacher.price_per_hour if teacher else 31.00

    single_price = get_lesson_price(
        lesson_type=lesson_type,
        duration=duration,
        teacher_pricing_schema=teacher_pricing_schema,
        teacher_hourly_rate=teacher_hourly_rate,
    )

    subtotal = round(single_price * PACKAGE_SIZE, 2)
    discount_amount = round(subtotal * (PACKAGE_DISCOUNT_PERCENT / 100.0), 2)
    total_price = round(subtotal - discount_amount, 2)
    per_lesson_price = round(total_price / PACKAGE_SIZE, 2)

    return {
        "lesson_type": lesson_type,
        "duration": duration,
        "count": PACKAGE_SIZE,
        "single_price": single_price,
        "subtotal": subtotal,
        "discount_percent": PACKAGE_DISCOUNT_PERCENT,
        "discount_amount": discount_amount,
        "total_price": total_price,
        "per_lesson_price": per_lesson_price,
        "currency": "EUR",
    }


def consume_package_credit(db: Session, package_id: str) -> bool:
    """
    Atomically increments used_credits by 1 if used_credits < total_credits.
    Returns True on success, False if no credits remain or package not active.
    """
    stmt = text(
        """
        UPDATE lesson_packages
        SET used_credits = used_credits + 1,
            status = CASE WHEN used_credits + 1 >= total_credits THEN 'completed' ELSE 'active' END
        WHERE id = :pkg_id AND used_credits < total_credits AND status = 'active'
        """
    )
    result = db.execute(stmt, {"pkg_id": package_id})
    db.commit()
    return result.rowcount > 0


def restore_package_credit(db: Session, package_id: str) -> bool:
    """
    Atomically decrements used_credits by 1 (down to min 0) when a package lesson is cancelled.
    Returns True on success.
    """
    stmt = text(
        """
        UPDATE lesson_packages
        SET used_credits = CASE WHEN used_credits > 0 THEN used_credits - 1 ELSE 0 END,
            status = 'active'
        WHERE id = :pkg_id
        """
    )
    result = db.execute(stmt, {"pkg_id": package_id})
    db.commit()
    return result.rowcount > 0
