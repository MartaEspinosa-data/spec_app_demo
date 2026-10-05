"""
Idempotent database bootstrap, run by entrypoint.sh on every container start.

1. Creates any missing tables from the current SQLAlchemy models
   (create_all never drops or alters existing tables/data).
2. Alembic: on a fresh DB the schema is already at the latest version, so we
   just stamp it; on an existing DB we apply pending migrations.
   NOTE: the migration history currently has two heads (004 and f98a7118c011),
   so we always target "heads" (plural).
3. Seeds the teacher row (with the fixed ID the frontend expects) if none exists.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect

from alembic import command
from alembic.config import Config

from app.database.database import Base, engine, SessionLocal
from app.models.teacher import Teacher
from app.models.student import Student  # noqa: F401  (register model)
from app.models.lesson import Lesson  # noqa: F401  (register model)
from app.models.availability import TeacherAvailability  # noqa: F401  (register model)

TEACHER_ID = os.getenv("TEACHER_ID", "dc92ef71-d458-4e75-92d9-69b64fc1c964")
TEACHER_EMAIL = os.getenv("TEACHER_EMAIL", "martaespinosagarcia@gmail.com")

MARTA_BIO = """Clase de conversación / Let's talk

In this class we will focus on improving the pronunciation to make you sound like a native speaker. You will also improve your fluency while we speak about different topics: such environment, movies, Spanish food, places to travel, your hobbies...

I have plenty of resources like articles, videos, games that can spark many different interesting conversations.

¡Hablemos!

En esta clase nos centraremos en mejorar la pronunciación y el acento para que hables como un nativo. También mejorarás tu fluidez mientras hablamos de diferentes temas como, por ejemplo: medio ambiente, películas, comida española, lugares por donde viajar, tus aficiones...

Tengo muchos recursos como artículos, vídeos, juegos que pueden generar muchas conversaciones interesantes diferentes."""


def ensure_schema() -> None:
    existing = set(inspect(engine).get_table_names())
    fresh_db = "teachers" not in existing

    Base.metadata.create_all(bind=engine)
    print(f"[bootstrap] Tables ensured (fresh_db={fresh_db}).")

    cfg = Config(os.path.join(os.path.dirname(os.path.abspath(__file__)), "alembic.ini"))
    if fresh_db or "alembic_version" not in existing:
        command.stamp(cfg, "heads")
        print("[bootstrap] Alembic stamped at heads.")
    else:
        command.upgrade(cfg, "heads")
        print("[bootstrap] Alembic upgraded to heads.")


def ensure_teacher() -> None:
    db = SessionLocal()
    try:
        if db.query(Teacher).count() > 0:
            print("[bootstrap] Teacher already present, skipping seed.")
            return
        db.add(Teacher(
            id=TEACHER_ID,
            name="Profe Marta",
            email=TEACHER_EMAIL,
            bio=MARTA_BIO,
            languages=["Spanish", "English", "French"],
            price_per_hour=30.94,
            pricing_schema={"30": 16.33, "45": 23.55, "60": 30.94},
            lessons_taught=558,
            # password_hash left empty: login falls back to TEACHER_PASSWORD env var
        ))
        db.commit()
        print(f"[bootstrap] Seeded teacher Profe Marta ({TEACHER_ID}).")
    finally:
        db.close()


if __name__ == "__main__":
    ensure_schema()
    ensure_teacher()
