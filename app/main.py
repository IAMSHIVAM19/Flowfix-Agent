import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
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
from .api.technician_portal import (
    router as technician_portal_router,
)
from .init_db import init_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_database()
    except Exception as e:
        print(f"Notice: Database initialization skipped ({e})")
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

cors_origins_raw = os.getenv("CORS_ORIGINS", "").strip()
if cors_origins_raw == "*":
    allow_origins = ["*"]
    allow_credentials = False
elif cors_origins_raw:
    allow_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]
    allow_credentials = True
else:
    allow_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# FRONTEND SPA BROWSER REFRESH NAVIGATION MIDDLEWARE
# ============================================================

frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)

@app.middleware("http")
async def spa_navigation_middleware(request: Request, call_next):
    # When a user reloads or navigates directly to an SPA page in the browser
    # (e.g. /requests, /appointments, /customers), the browser sends Accept: text/html
    # or Sec-Fetch-Dest: document. We must serve index.html instead of returning 401 JSON.
    if request.method == "GET" and os.path.isdir(frontend_dist):
        path = request.url.path
        accept = request.headers.get("accept", "")
        dest = request.headers.get("sec-fetch-dest", "")

        excluded_prefixes = (
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/assets",
            "/favicon",
        )

        if not path.startswith(excluded_prefixes):
            if dest == "document" or "text/html" in accept:
                target = os.path.join(frontend_dist, path.lstrip("/"))
                if path != "/" and os.path.isfile(target):
                    return FileResponse(target)
                index_file = os.path.join(frontend_dist, "index.html")
                if os.path.isfile(index_file):
                    return FileResponse(index_file)

    return await call_next(request)


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(requests_router)
app.include_router(appointments_router)
app.include_router(customers_router)
app.include_router(technicians_router)
app.include_router(technician_portal_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(admin_router)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "FlowFix API is running",
    }


# ============================================================
# FRONTEND SPA STATIC SERVING (Unified Deployment)
# ============================================================

if os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def home():
        return {
            "message": "FlowFix API is running",
            "docs": "/docs",
        }