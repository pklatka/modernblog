"""Service management for ModernBlog."""

import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

from rich.console import Console

from modernblog.backend.config import get_default_config_dir

console = Console()

SERVICE_NAME = "modernblog"
SERVICE_FILE = f"/etc/systemd/system/{SERVICE_NAME}.service"


def _generate_service_content(
    config_dir: Optional[str] = None,
    user: Optional[str] = None,
    port: int = 8080,
    host: str = "0.0.0.0",
    workers: int = 1,
    ssl_keyfile: Optional[str] = None,
    ssl_certfile: Optional[str] = None,
) -> str:
    """Generate systemd service file content."""
    import getpass

    if user is None:
        user = getpass.getuser()

    if config_dir:
        config_path = Path(config_dir).resolve()
    else:
        config_path = get_default_config_dir().resolve()

    executable = sys.executable
    modernblog_bin = shutil.which("modernblog")

    if modernblog_bin:
        cmd = f"{modernblog_bin} run --port {port} --host {host} --workers {workers}"
    else:
        cmd = (
            f"{executable} -m modernblog.cli.cli run "
            f"--port {port} --host {host} --workers {workers}"
        )

    if config_dir:
        cmd += f" --config-dir {config_path}"

    if ssl_keyfile and ssl_certfile:
        cmd += f" --ssl-keyfile {ssl_keyfile} --ssl-certfile {ssl_certfile}"

    return f"""[Unit]
Description=ModernBlog Service
After=network.target

[Service]
Type=simple
User={user}
ExecStart={cmd}
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
"""


def _check_systemd() -> bool:
    """Check if systemd is available."""
    return shutil.which("systemctl") is not None


def _run_systemctl(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a systemctl command."""
    return subprocess.run(
        ["sudo", "systemctl"] + args,
        check=check,
        capture_output=True,
        text=True,
    )


def start_service(
    config_dir: Optional[str] = None,
    user: Optional[str] = None,
    port: int = 8080,
    host: str = "0.0.0.0",
    workers: int = 1,
    ssl_keyfile: Optional[str] = None,
    ssl_certfile: Optional[str] = None,
) -> None:
    """Start ModernBlog as a systemd service."""

    if not _check_systemd():
        console.print(
            "[yellow]Warning: 'systemctl' not found. "
            "This command is intended for systemd-based Linux systems.[/yellow]"
        )
        console.print(
            "\nTo run ModernBlog in the foreground, use: [bold]modernblog run[/bold]"
        )
        return

    service_content = _generate_service_content(
        config_dir, user, port, host, workers, ssl_keyfile, ssl_certfile
    )

    console.print("[bold]Starting ModernBlog as a service...[/bold]\n")

    # Write service file to temp location first
    temp_service = Path("/tmp/modernblog.service")
    with open(temp_service, "w") as f:
        f.write(service_content)

    console.print("[dim]Service configuration:[/dim]")
    console.print(f"[dim]{service_content}[/dim]")

    try:
        # Move service file to systemd directory
        console.print(f"Installing service file to {SERVICE_FILE}...")
        subprocess.run(
            ["sudo", "mv", str(temp_service), SERVICE_FILE],
            check=True,
        )

        # Reload systemd
        console.print("Reloading systemd daemon...")
        _run_systemctl(["daemon-reload"])

        # Enable service
        console.print("Enabling service...")
        _run_systemctl(["enable", SERVICE_NAME])

        # Start service
        console.print("Starting service...")
        _run_systemctl(["start", SERVICE_NAME])

        # Check status
        result = _run_systemctl(["is-active", SERVICE_NAME], check=False)
        if result.stdout.strip() == "active":
            console.print(
                "\n[bold green]✓ ModernBlog is now running as a service![/bold green]"
            )
            console.print("\nUseful commands:")
            console.print(
                f"  • Check status: [bold]sudo systemctl status {SERVICE_NAME}[/bold]"
            )
            console.print(
                f"  • View logs:    [bold]sudo journalctl -u {SERVICE_NAME} -f[/bold]"
            )
            console.print("  • Stop service: [bold]modernblog stop[/bold]")
        else:
            console.print(
                "[yellow]Service may not have started correctly. "
                "Check status with:[/yellow]"
            )
            console.print(f"  [bold]sudo systemctl status {SERVICE_NAME}[/bold]")

    except subprocess.CalledProcessError as e:
        console.print("[bold red]Error:[/bold red] Failed to start service")
        if e.stderr:
            console.print(f"[red]{e.stderr}[/red]")
        console.print("\nYou may need to run this command with sudo privileges.")
    except PermissionError:
        console.print(
            "[bold red]Error:[/bold red] Permission denied. Try running with sudo."
        )


def stop_service() -> None:
    """Stop the ModernBlog systemd service."""

    if not _check_systemd():
        console.print(
            "[yellow]Warning: 'systemctl' not found. "
            "This command is intended for systemd-based Linux systems.[/yellow]"
        )
        return

    console.print("[bold]Stopping ModernBlog service...[/bold]\n")

    try:
        # Check if service exists
        result = _run_systemctl(["is-active", SERVICE_NAME], check=False)

        if result.returncode != 0 and "could not be found" in result.stderr.lower():
            console.print(
                f"[yellow]Service '{SERVICE_NAME}' is not installed.[/yellow]"
            )
            console.print("\nTo start the service, use: [bold]modernblog start[/bold]")
            return

        # Stop service
        console.print("Stopping service...")
        _run_systemctl(["stop", SERVICE_NAME])

        # Disable service (so it doesn't start on boot)
        console.print("Disabling service...")
        _run_systemctl(["disable", SERVICE_NAME])

        console.print("\n[bold green]✓ ModernBlog service stopped.[/bold green]")
        console.print("\nTo start again: [bold]modernblog start[/bold]")

    except subprocess.CalledProcessError as e:
        console.print("[bold red]Error:[/bold red] Failed to stop service")
        if e.stderr:
            console.print(f"[red]{e.stderr}[/red]")
    except PermissionError:
        console.print(
            "[bold red]Error:[/bold red] Permission denied. Try running with sudo."
        )
