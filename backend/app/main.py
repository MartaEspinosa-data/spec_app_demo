from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import teachers, lessons, webhooks, availability, students, packages
from apscheduler.schedulers.background import BackgroundScheduler
from app.utils.reminders import check_reminders

app = FastAPI(title="Spanish Tutor Platform API")

app.include_router(teachers.router)
app.include_router(lessons.router)
app.include_router(webhooks.router)
app.include_router(availability.router)
app.include_router(students.router)
app.include_router(packages.router)

# Periodic tasks
scheduler = BackgroundScheduler()
scheduler.add_job(check_reminders, 'interval', minutes=5)
scheduler.start()
# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://localhost:5173",
    "https://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://127.0.0.1:5173",
    "https://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/")
def read_root():
    return {"message": "Welcome to Spanish Tutor Platform API"}
