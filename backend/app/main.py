from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import teachers, lessons, webhooks, availability, students, packages

app = FastAPI(title="Spanish Tutor Platform API")

app.include_router(teachers.router)
app.include_router(lessons.router)
app.include_router(webhooks.router)
app.include_router(availability.router)
app.include_router(students.router)
app.include_router(packages.router)
# Configure CORS
origins = [
    "http://localhost:5173",
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
