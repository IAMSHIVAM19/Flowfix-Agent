from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


app = FastAPI(
    title="FlowFix API",
    version="1.0.0",
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