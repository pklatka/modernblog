"""Server runner for ModernBlog."""

import os
from typing import Optional

from rich.console import Console

console = Console()


def run_server(
    host: str = "0.0.0.0",
    port: int = 8080,
    reload: bool = False,
    workers: int = 1,
    ssl_keyfile: Optional[str] = None,
    ssl_certfile: Optional[str] = None,
    config_dir: Optional[str] = None,
) -> None:
    """Start the blog server."""
    import uvicorn

    from modernblog.backend.config import config_exists, get_data_dir, init_settings

    # Check if setup has been run
    if not config_exists(config_dir):
        console.print("[yellow]No configuration found.[/yellow]")
        console.print("Running setup wizard first...\n")
        from .setup_wizard import run_setup_wizard

        run_setup_wizard(config_dir)

        # Check again after setup
        if not config_exists(config_dir):
            console.print(
                "[red]Setup cancelled. Cannot start server without configuration.[/red]"
            )
            return

    # Initialize settings
    settings = init_settings(config_dir)

    # Create data directories
    data_dir = get_data_dir(config_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "uploads").mkdir(exist_ok=True)

    # Initialize database if needed
    from modernblog.backend.database import get_session_local, init_database
    from modernblog.backend.models import Post

    # Initialize tables
    init_database()

    # Check if we need example posts
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        if db.query(Post).count() == 0:
            console.print(
                "[yellow]Initializing database with example posts...[/yellow]"
            )
            from modernblog.backend.initialization import create_example_posts

            create_example_posts()
    except Exception as e:
        console.print(f"[red]Failed to initialize example posts: {e}[/red]")
    finally:
        db.close()

    # Set environment variables for the app
    os.environ["MODERNBLOG_CONFIG_DIR"] = config_dir or ""
    os.environ["MODERNBLOG_DATA_DIR"] = str(data_dir)

    from modernblog.backend.app import get_static_dir

    static_dir = get_static_dir()
    has_frontend = static_dir.exists()

    console.print()
    console.print("[bold green]🚀 Starting ModernBlog...[/bold green]")
    console.print()
    console.print(f"  [cyan]Blog:[/cyan] {settings.BLOG_TITLE}")
    console.print(f"  [cyan]Author:[/cyan] {settings.AUTHOR_NAME}")
    console.print(
        f"  [cyan]Server:[/cyan] http://{host if host != '0.0.0.0' else 'localhost'}:{port}"
    )
    console.print(
        f"  [cyan]Admin:[/cyan] http://{host if host != '0.0.0.0' else 'localhost'}:{port}/admin"
    )
    console.print(f"  [cyan]Data:[/cyan] {data_dir}")

    if not has_frontend:
        console.print()
        console.print(
            "[yellow]⚠ Frontend not built. Run 'npm run build' in modernblog/frontend/ first.[/yellow]"
        )

    console.print()
    console.print("[dim]Press Ctrl+C to stop the server[/dim]")
    console.print()
    
    if reload:
        # Development mode
        import uvicorn

        console.print("[dim]Running in development mode...[/dim]")
        uvicorn.run(
            "modernblog.backend.app:app",
            host=host,
            port=port,
            reload=reload,
            ssl_keyfile=ssl_keyfile,
            ssl_certfile=ssl_certfile,
            log_level="info",
        )
    else:
        # Production mode
        from gunicorn.app.base import BaseApplication

        class ModernBlogApplication(BaseApplication):
            """Custom Gunicorn application for ModernBlog."""

            def __init__(self, app_module: str, options: dict = None):
                self.options = options or {}
                self.app_module = app_module
                super().__init__()

            def load_config(self):
                for key, value in self.options.items():
                    if key in self.cfg.settings and value is not None:
                        self.cfg.set(key.lower(), value)

            def load(self):
                # Import and return the app
                from modernblog.backend.app import app

                return app

        gunicorn_options = {
            "bind": f"{host}:{port}",
            "workers": workers,
            "worker_class": "uvicorn.workers.UvicornWorker",
            "accesslog": "-",
            "errorlog": "-",
            "loglevel": "info",
        }

        if ssl_keyfile and ssl_certfile:
            gunicorn_options["keyfile"] = ssl_keyfile
            gunicorn_options["certfile"] = ssl_certfile

        console.print(
            f"[dim]Running in production mode with gunicorn "
            f"({workers} worker{'s' if workers > 1 else ''})...[/dim]"
        )
        ModernBlogApplication("modernblog.backend.app:app", gunicorn_options).run()
