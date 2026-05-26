from dotenv import load_dotenv
load_dotenv()

import time
import os
from contextlib import asynccontextmanager
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import teachers, lessons, availability, students, packages, webhooks
from apscheduler.schedulers.background import BackgroundScheduler
from app.utils.reminders import check_reminders

# Periodic tasks — global for lifespan access
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle for the FastAPI application."""
    # Startup
    scheduler.add_job(check_reminders, 'interval', minutes=5)
    scheduler.start()
    yield
    # Shutdown — graceful cleanup
    if scheduler.running:
        scheduler.shutdown(wait=False)


app = FastAPI(title="Spanish Tutor Platform API", lifespan=lifespan)

app.include_router(teachers.router)
app.include_router(lessons.router)
app.include_router(availability.router)
app.include_router(students.router)
app.include_router(packages.router)
app.include_router(webhooks.router)

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


# ── Request Logging Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming request — method, path, status, and duration."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    # Structured log line (replaces scattered debug prints)
    print(
        f"[{response.status_code}] {request.method} {request.url.path}"
        f" — {duration_ms:.1f}ms"
    )
    return response


# ── Simple In-Memory Rate Limiter ─────────────────────────────────────────────
# Rate-limit sensitive endpoints (login, slot-polling) to prevent abuse.
# Uses a sliding-window approach: max requests per IP within a window.

RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW_SEC", "60"))  # seconds
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "30"))   # per window

# IP -> list of timestamps
rate_store: dict[str, list[float]] = defaultdict(list)

# Endpoints that should be rate-limited
RATE_LIMITED_PREFIXES = [
    "/api/v1/students/login",
    "/api/v1/students/register",
    "/api/v1/teachers/login",
    "/api/v1/lessons/slots",
]


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to authentication and slot-polling endpoints."""
    path = request.url.path

    # Only rate-limit matching prefixes
    should_limit = any(path.startswith(prefix) for prefix in RATE_LIMITED_PREFIXES)
    if not should_limit:
        return await call_next(request)

    # Identify client (X-Forwarded-For → host)
    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or request.client.host if request.client else "unknown"
    )

    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW

    # Prune old entries
    rate_store[client_ip] = [t for t in rate_store[client_ip] if t > window_start]

    if len(rate_store[client_ip]) >= RATE_LIMIT_MAX:
        retry_after = int(RATE_LIMIT_WINDOW - (now - rate_store[client_ip][0]))
        return JSONResponse(
            status_code=429,
            content={
                "detail": f"Rate limit exceeded. Try again in {retry_after} seconds.",
                "retry_after": max(retry_after, 1),
            },
            headers={"Retry-After": str(max(retry_after, 1))},
        )

    rate_store[client_ip].append(now)
    return await call_next(request)


# ── Health & Root ─────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/")
def read_root():
    return {"message": "Welcome to Spanish Tutor Platform API"}
