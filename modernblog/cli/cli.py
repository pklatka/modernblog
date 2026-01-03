"""CLI commands for ModernBlog."""

import os
import sys

import click
from rich.console import Console

from modernblog import __version__

console = Console()


@click.group()
@click.version_option(version=__version__, prog_name="modernblog")
def cli():
    """ModernBlog - A self-hosted, modern blogging platform.

    Get started by running 'modernblog setup' to configure your blog,
    then 'modernblog run' to start the server.
    """
    pass


@cli.command()
@click.option("--config-dir", type=click.Path(), help="Custom config directory path")
def setup(config_dir):
    """Run the interactive setup wizard to configure your blog."""
    from .setup_wizard import run_setup_wizard

    run_setup_wizard(config_dir)


@cli.command()
@click.option("--port", "-p", default=8080, help="Port to run the server on")
@click.option("--host", "-h", default="0.0.0.0", help="Host to bind to")
@click.option("--reload", is_flag=True, help="Enable auto-reload for development")
@click.option("--workers", "-w", default=1, help="Number of worker processes")
@click.option("--ssl-keyfile", type=click.Path(exists=True), help="SSL key file")
@click.option(
    "--ssl-certfile", type=click.Path(exists=True), help="SSL certificate file"
)
@click.option("--config-dir", type=click.Path(), help="Custom config directory path")
def run(port, host, reload, workers, ssl_keyfile, ssl_certfile, config_dir):
    """Start the blog server."""
    from .server import run_server

    run_server(
        host=host,
        port=port,
        reload=reload,
        workers=workers,
        ssl_keyfile=ssl_keyfile,
        ssl_certfile=ssl_certfile,
        config_dir=config_dir,
    )


@cli.command()
@click.option("--config-dir", type=click.Path(), help="Custom config directory path")
def config(config_dir):
    """Show or edit the current configuration."""
    from rich.table import Table

    from modernblog.backend.config import get_config_path, load_config

    config_path = get_config_path(config_dir)

    if not config_path.exists():
        console.print("[yellow]No configuration found.[/yellow]")
        console.print("Run [bold]modernblog setup[/bold] to create one.")
        return

    cfg = load_config(config_dir)

    table = Table(title="ModernBlog Configuration")
    table.add_column("Setting", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Blog Title", cfg.get("blog_title", ""))
    table.add_row("Author Name", cfg.get("author_name", ""))
    table.add_row("Author Bio", cfg.get("author_bio", ""))
    table.add_row("GitHub Sponsor URL", cfg.get("github_sponsor_url", ""))
    table.add_row("Config Path", str(config_path))
    table.add_row("Data Directory", cfg.get("data_dir", ""))

    if cfg.get("theme"):
        table.add_row("Theme", cfg["theme"].get("name", "amber").capitalize())

    console.print(table)


@cli.command()
@click.option("--config-dir", type=click.Path(), help="Custom config directory path")
@click.option("--yes", "-y", is_flag=True, help="Skip confirmation prompt")
def uninstall(config_dir, yes):
    """Remove all ModernBlog data and configuration.

    This will delete the entire .modernblog directory including:
    - Configuration files
    - Database
    - Uploaded images
    - All blog posts

    This action cannot be undone!
    """
    import shutil
    from pathlib import Path

    from modernblog.backend.config import get_default_config_dir, load_config

    # Determine the config directory to remove
    if config_dir:
        target_dir = Path(config_dir)
    else:
        target_dir = get_default_config_dir()

    if not target_dir.exists():
        console.print("[yellow]No ModernBlog installation found.[/yellow]")
        console.print(f"Directory [bold]{target_dir}[/bold] does not exist.")
        return

    # Check if there's a custom data directory
    cfg = load_config(config_dir)
    data_dir = cfg.get("data_dir")
    custom_data_dir = (
        Path(data_dir) if data_dir and data_dir != str(target_dir / "data") else None
    )

    # Show what will be deleted
    console.print("\n[bold red]⚠️  WARNING: This will permanently delete:[/bold red]\n")
    console.print(f"  • [cyan]{target_dir}[/cyan] (config & data)")
    if custom_data_dir and custom_data_dir.exists():
        console.print(f"  • [cyan]{custom_data_dir}[/cyan] (custom data directory)")

    console.print(
        "\n[bold]This includes all posts, images, and configuration![/bold]\n"
    )

    if not yes:
        if not click.confirm("Are you sure you want to continue?", default=False):
            console.print("[green]Uninstall cancelled.[/green]")
            return

    # Perform the deletion
    try:
        shutil.rmtree(target_dir)
        console.print(f"[green]✓[/green] Removed {target_dir}")

        if custom_data_dir and custom_data_dir.exists():
            shutil.rmtree(custom_data_dir)
            console.print(f"[green]✓[/green] Removed {custom_data_dir}")

        console.print(
            "\n[bold green]ModernBlog has been completely uninstalled.[/bold green]"
        )
        console.print("\nTo also remove the CLI tool itself, run:")
        console.print(
            "  [bold]pip uninstall modernblog[/bold]  or  "
            "[bold]uv pip uninstall modernblog[/bold]"
        )

    except PermissionError:
        console.print(
            "[bold red]Error:[/bold red] Permission denied. Try running with sudo."
        )
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


@cli.command()
@click.option("--config-dir", type=click.Path(), help="Custom config directory path")
@click.option("--user", help="User to run the service as (default: current user)")
@click.option("--port", "-p", default=8080, help="Port to run the server on")
@click.option("--host", "-h", default="0.0.0.0", help="Host to bind to")
@click.option("--workers", "-w", default=1, help="Number of worker processes")
@click.option("--ssl-keyfile", type=click.Path(exists=True), help="SSL key file")
@click.option(
    "--ssl-certfile", type=click.Path(exists=True), help="SSL certificate file"
)
def start(config_dir, user, port, host, workers, ssl_keyfile, ssl_certfile):
    """Start ModernBlog as a background service.

    This installs and starts a systemd service that runs on boot
    and automatically restarts on failure.

    Use 'modernblog run' to run in the foreground instead.
    """
    from .service import start_service

    start_service(
        config_dir=config_dir,
        user=user,
        port=port,
        host=host,
        workers=workers,
        ssl_keyfile=ssl_keyfile,
        ssl_certfile=ssl_certfile,
    )


@cli.command()
def stop():
    """Stop the ModernBlog background service.

    This stops and disables the systemd service.
    """
    from .service import stop_service

    stop_service()


@cli.command(name="check")
@click.option("--config-dir", type=click.Path(), help="Custom config directory path")
def check(config_dir):
    """Check environment for deployment issues."""
    import shutil

    from modernblog.backend.config import get_config_path, get_data_dir

    console.print("[bold]Checking environment...[/bold]")

    # Check 1: Config existence
    config_path = get_config_path(config_dir)
    if config_path.exists():
        console.print("[green]✓[/green] Configuration found")
    else:
        console.print("[red]✗[/red] No configuration found. Run 'modernblog setup'")
        sys.exit(1)

    # Check 2: Data directory permissions
    data_dir = get_data_dir(config_dir)
    if not data_dir.exists():
        console.print(
            f"[yellow]![/yellow] Data directory {data_dir} "
            "does not exist (will be created)"
        )
    elif os.access(data_dir, os.W_OK):
        console.print(f"[green]✓[/green] Data directory writable: {data_dir}")
    else:
        console.print(f"[red]✗[/red] Data directory not writable: {data_dir}")

    # Check 3: Dependencies
    try:
        import fastapi
        import sqlalchemy
        import uvicorn

        deps = (
            f"FastAPI {fastapi.__version__}, "
            f"Uvicorn {uvicorn.__version__}, "
            f"SQLAlchemy {sqlalchemy.__version__}"
        )
        console.print(f"[green]✓[/green] Dependencies installed ({deps})")
    except ImportError as e:
        console.print(f"[red]✗[/red] Missing dependency: {e}")

    # Check 4: System tools
    if shutil.which("systemctl"):
        console.print(
            "[green]✓[/green] systemd detected (service installation supported)"
        )
    else:
        console.print(
            "[yellow]![/yellow] systemd not detected "
            "(service installation might not work directly)"
        )

    console.print("\n[bold green]Checks completed.[/bold green]")


if __name__ == "__main__":
    cli()
