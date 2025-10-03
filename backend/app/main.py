from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routers import admin_auth, admin_models, admin_vendors, public, uploads
from .core.config import get_settings
from .core.database import init_db
from .core.logging import configure_logging

configure_logging()
settings = get_settings()
init_db()

app = FastAPI(title="Model Price Hub", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth.router, prefix="/api")
app.include_router(admin_vendors.router, prefix="/api")
app.include_router(admin_models.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
