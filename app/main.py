from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .api.admin import router as admin_router
from .api.appointments import (
    router as appointments_router,
)
from .api.auth import router as auth_router
from .api.customers import (
    router as customers_router,
)
from .api.dashboard import (
    router as dashboard_router,
)
from .api.requests import router as requests_router
from .api.technicians import (
    router as technicians_router,
)
from .database import SessionLocal
from .models_db import Service
from .seed import seed_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed initial catalog and technicians if the database is fresh
    try:
        with SessionLocal() as db:
            has_services = db.scalar(select(Service.id).limit(1))
            if not has_services:
                print("Fresh database detected: automatically seeding default services, technicians, and availability...")
                seed_all(db)
    except Exception as e:
        print(f"Notice: Initial auto-seed check skipped ({e})")
    yield


app = FastAPI(
    title="FlowFix API",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(requests_router)
app.include_router(appointments_router)
app.include_router(customers_router)
app.include_router(technicians_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(admin_router)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def home():
    return {
        "message": "FlowFix API is running"
    }