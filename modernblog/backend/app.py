"""FastAPI application for ModernBlog."""

import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func

from .config import get_settings, init_settings
from .database import get_session_local, init_database
from .middleware import RateLimitMiddleware
from .models import Post
from .routers import comments, images, posts, subscribers, tags
from .schemas import BlogInfo
from .security import create_access_token, verify_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    config_dir = os.environ.get("MODERNBLOG_CONFIG_DIR") or None
    init_settings(config_dir)
    init_database()

    settings = get_settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    yield
    # Shutdown


app = FastAPI(
    title="ModernBlog API",
    description="A self-hosted, modern blogging platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
    ],
)

# Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware)


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Include routers
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(tags.router)
app.include_router(images.router)
app.include_router(subscribers.router)


@app.get("/api")
async def root():
    """API root endpoint."""
    return {"message": "ModernBlog API", "version": "1.0.0"}


@app.get("/api/info", response_model=BlogInfo)
async def get_blog_info():
    """Get blog metadata and stats."""
    settings = get_settings()
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        total_posts = (
            db.query(Post)
            .filter(Post.is_published, Post.published_at <= datetime.utcnow())
            .count()
        )
        total_views = (
            db.query(func.sum(Post.views))
            .filter(Post.is_published, Post.published_at <= datetime.utcnow())
            .scalar()
            or 0
        )
    finally:
        db.close()

    # Check if SMTP is configured for subscriptions
    subscription_enabled = bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)

    return BlogInfo(
        title=settings.BLOG_TITLE,
        description=settings.BLOG_DESCRIPTION,
        author_name=settings.AUTHOR_NAME,
        author_bio=settings.AUTHOR_BIO,
        github_sponsor_url=settings.GITHUB_SPONSOR_URL,
        total_posts=total_posts,
        total_views=total_views,
        subscription_enabled=subscription_enabled,
        comment_approval_required=settings.COMMENT_APPROVAL_REQUIRED,
        language=settings.LANGUAGE,
    )


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/theme.css")
async def get_theme_css():
    """Serve custom theme CSS based on user configuration."""
    from .themes import get_theme_css as generate_theme_css

    settings = get_settings()
    css = generate_theme_css(settings.THEME_NAME)

    return Response(content=css, media_type="text/css")


@app.post("/api/auth/login")
async def admin_login(request: dict):
    """Verify admin password and return JWT token."""
    settings = get_settings()
    token = request.get("token", "")

    if verify_password(token, settings.ADMIN_PASSWORD_HASH):
        access_token = create_access_token(
            data={"sub": "admin"}, secret_key=settings.SECRET_KEY
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "success": True,
            "message": "Authenticated successfully",
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid admin password")


# Serve frontend static files
def get_static_dir() -> Path:
    """Get the path to the bundled static files."""
    package_dir = Path(__file__).parent

    # Production: static files bundled with package (modernblog/static/dist)
    static_dir = package_dir.parent / "static" / "dist"
    if static_dir.exists():
        return static_dir

    # Development: use frontend/dist from modernblog package
    dev_static_dir = package_dir.parent / "frontend" / "dist"
    if dev_static_dir.exists():
        return dev_static_dir

    return static_dir


static_dir = get_static_dir()

if static_dir.exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        """Serve frontend for all non-API routes."""
        from fastapi import HTTPException

        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")

        # Try to serve static file if it exists
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))

        # Fallback to index.html for SPA routing
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        raise HTTPException(status_code=404, detail="Frontend not built")
