from app.database import database
from app.models import teacher, lesson, student
from sqlalchemy.orm import Session

def seed():
    # Create tables - this will use the Base from the imported models
    teacher.Base.metadata.create_all(bind=database.engine)
    
    db: Session = database.SessionLocal()
    
    # Check if we already have teachers
    if db.query(teacher.Teacher).count() > 0:
        print("Database already seeded. Skipping.")
        return

    # Add a demo teacher
    demo_teacher = teacher.Teacher(
        name="Profe Marta",
        bio="""¡Hola! I am Marta, a specialized Spanish teacher for English speakers. 
        With over 10 years of experience, I focus on 'Total Immersion' techniques that get you speaking from day one.
        
        My lessons are dynamic, cultural, and tailored to your specific goals (travel, business, or hobby).
        I provide all materials including vocabulary lists and grammar notes after every session. 
        ¡Nos vemos en clase!""",
        languages=["Spanish", "English", "French"],
        price_per_hour=35.0,
        video_url="https://youtu.be/gfoATSeL8pU",
        calendly_url="https://calendly.com/mateo-hola-lingo/60min"
    )

    db.add(demo_teacher)
    db.commit()
    db.refresh(demo_teacher)
    print(f"Seeded teacher: {demo_teacher.name} (ID: {demo_teacher.id})")
    db.close()

if __name__ == "__main__":
    seed()
