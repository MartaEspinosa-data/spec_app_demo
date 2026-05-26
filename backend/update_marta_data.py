from app.database import database
from app.models import teacher
from sqlalchemy.orm import Session
from sqlalchemy import text

def update_teacher_marta():
    db: Session = database.SessionLocal()
    
    # Ensure columns exist (SQLite doesn't support complex migrations easily, but we can try adding them)
    try:
        db.execute(text("ALTER TABLE teachers ADD COLUMN pricing_schema JSON DEFAULT '{}'"))
        db.execute(text("ALTER TABLE teachers ADD COLUMN lessons_taught FLOAT DEFAULT 0.0"))
        db.commit()
    except Exception as e:
        print(f"Columns might already exist: {e}")
        db.rollback()

    marta = db.query(teacher.Teacher).first()
    if marta:
        marta.name = "Profe Marta"
        marta.lessons_taught = 558
        marta.bio = """Clase de conversación/ Let´s talk
558 Lessons taught
Language
Spanish
Level
A1 - C1
Category
Conversation
Description
Let´s talk:

In this class we will focus on improving the pronunciation to make you sound like a native speaker. You will also improve your fluency while we speak about different topics: such environment, movies, Spanish food, places to travel, your hobbies... 

I have plenty of resources like articles, videos, games that can spark many different interesting conversations.

¡Hablemos!:

En esta clase nos centraremos en mejorar la pronunciación y el acento para que hables como un nativo. También mejorarás tu fluidez mientras hablamos de diferentes temas como, por ejemplo: medio ambiente, películas, comida española, lugares por donde viajar, tus aficiones ...

Tengo muchos recursos como artículos, videos, juegos que pueden generar muchas conversaciones interesantes diferentes."""
        
        marta.pricing_schema = {
            "30": 16.34,
            "45": 23.56,
            "60": 30.95
        }
        # Update base price_per_hour for legacy support if needed
        marta.price_per_hour = 30.95
        
        db.commit()
        print(f"Updated teacher {marta.name} with new bio and pricing schema.")
    else:
        print("No teacher found.")
    db.close()

if __name__ == "__main__":
    update_teacher_marta()
