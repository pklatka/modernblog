#!/usr/bin/env python3
import argparse
import re
import subprocess
import sys
from pathlib import Path
from typing import Optional

# Check for rich
try:
    from rich.console import Console
    from rich.prompt import Confirm

    console = Console()
except ImportError:
    print(
        "This script requires 'rich'. Please run 'pip install rich' or 'uv pip install rich'."
    )
    sys.exit(1)


def run_command(
    command: list[str],
    dry_run: bool = False,
    check: bool = True,
    cwd: Optional[Path] = None,
) -> Optional[subprocess.CompletedProcess]:
    cmd_str = " ".join(command)
    cwd_str = f" (in {cwd})" if cwd else ""
    if dry_run:
        console.print(
            f"[bold yellow]DRY RUN:[/bold yellow] [dim]{cmd_str}{cwd_str}[/dim]"
        )
        return None

    console.print(f"[bold blue]RUNNING:[/bold blue] [dim]{cmd_str}{cwd_str}[/dim]")
    try:
        result = subprocess.run(
            command, check=check, capture_output=True, text=True, cwd=cwd
        )
        return result
    except subprocess.CalledProcessError as e:
        console.print(f"[bold red]ERROR running command:[/bold red] {cmd_str}")
        console.print(f"[red]{e.stderr}[/red]")
        if check:
            sys.exit(1)
        return e


def get_current_version(pyproject_path: Path) -> str:
    content = pyproject_path.read_text()
    match = re.search(r'version = "(\d+\.\d+\.\d+)"', content)
    if not match:
        console.print("[bold red]Could not find version in pyproject.toml[/bold red]")
        sys.exit(1)
    return match.group(1)


def bump_version(current_version: str, part: str) -> str:
    major, minor, patch = map(int, current_version.split("."))
    if part == "major":
        major += 1
        minor = 0
        patch = 0
    elif part == "minor":
        minor += 1
        patch = 0
    elif part == "patch":
        patch += 1
    return f"{major}.{minor}.{patch}"


def update_version_in_file(
    pyproject_path: Path, new_version: str, dry_run: bool = False
):
    if dry_run:
        console.print(
            f"[bold yellow]DRY RUN:[/bold yellow] Updating version to {new_version} in {pyproject_path}"
        )
        return

    content = pyproject_path.read_text()
    new_content = re.sub(
        r'version = "\d+\.\d+\.\d+"', f'version = "{new_version}"', content
    )
    pyproject_path.write_text(new_content)
    console.print(f"[green]Updated version to {new_version} in pyproject.toml[/green]")


def validate_version(version: str) -> bool:
    """Validate that version follows semver format (X.Y.Z)."""
    return bool(re.match(r"^\d+\.\d+\.\d+$", version))


def main():
    parser = argparse.ArgumentParser(description="Autorelease script for ModernBlog")
    parser.add_argument(
        "part",
        choices=["major", "minor", "patch"],
        nargs="?",
        default="patch",
        help="Version part to bump (ignored if --version is specified)",
    )
    parser.add_argument(
        "--version",
        "-v",
        type=str,
        help="Set exact version (e.g., 2.0.0) instead of bumping",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Print commands without executing them"
    )
    args = parser.parse_args()

    root_dir = Path(__file__).parent.parent
    pyproject_path = root_dir / "pyproject.toml"

    current_version = get_current_version(pyproject_path)

    if args.version:
        if not validate_version(args.version):
            console.print(
                f"[bold red]Invalid version format:[/bold red] {args.version}"
            )
            console.print("Version must be in format X.Y.Z (e.g., 1.2.3)")
            sys.exit(1)
        new_version = args.version
    else:
        new_version = bump_version(current_version, args.part)

    console.print(f"[bold]Current version:[/bold] {current_version}")
    console.print(f"[bold]New version:[/bold]     {new_version}")

    if not args.dry_run and not Confirm.ask(
        "Do you want to proceed with this release?"
    ):
        console.print("[yellow]Aborted.[/yellow]")
        sys.exit(0)

    # 1. Update version in pyproject.toml
    update_version_in_file(pyproject_path, new_version, args.dry_run)

    # 2. Git commit and tag
    run_command(["git", "add", "pyproject.toml"], args.dry_run)
    run_command(["git", "commit", "-m", f"Release {new_version}"], args.dry_run)
    run_command(["git", "tag", f"v{new_version}"], args.dry_run)

    # 3. Build Frontend
    console.print("[bold]Building frontend...[/bold]")
    frontend_dir = root_dir / "modernblog" / "frontend"
    if frontend_dir.exists():
        # Check if npm is available
        if subprocess.run(["which", "npm"], capture_output=True).returncode != 0:
            console.print(
                "[bold red]npm not found. Skipping frontend build. This might be bad![/bold red]"
            )
            if not Confirm.ask("Continue without building frontend?"):
                sys.exit(1)
        else:
            # run npm install
            run_command(["npm", "install"], args.dry_run, check=True, cwd=frontend_dir)
            # run npm run build
            run_command(
                ["npm", "run", "build"], args.dry_run, check=True, cwd=frontend_dir
            )
    else:
        console.print(
            "[yellow]Frontend directory not found, skipping frontend build.[/yellow]"
        )

    # 4. Build Package
    console.print("[bold]Building package...[/bold]")
    # Check if uv is available
    if subprocess.run(["which", "uv"], capture_output=True).returncode == 0:
        run_command(["uv", "build"], args.dry_run)
    else:
        run_command([sys.executable, "-m", "build"], args.dry_run)

    # 5. Push
    if args.dry_run or Confirm.ask("Push to origin?"):
        run_command(["git", "push", "origin", "main"], args.dry_run)
        run_command(["git", "push", "origin", f"v{new_version}"], args.dry_run)

    # 6. Create GitHub Release with dist assets
    if args.dry_run or Confirm.ask("Create GitHub Release?"):
        # Check if gh is installed
        if subprocess.run(["which", "gh"], capture_output=True).returncode == 0:
            # Find dist files to upload
            dist_dir = root_dir / "dist"
            dist_files = []
            if dist_dir.exists():
                dist_files = list(
                    dist_dir.glob(f"modernblog-{new_version}*.whl")
                ) + list(dist_dir.glob(f"modernblog-{new_version}*.tar.gz"))

            # Build command with dist files as assets
            release_cmd = [
                "gh",
                "release",
                "create",
                f"v{new_version}",
                "--generate-notes",
            ]
            for f in dist_files:
                release_cmd.append(str(f))

            run_command(release_cmd, args.dry_run)
        else:
            console.print("[bold yellow]GitHub CLI (gh) not found.[/bold yellow]")
            console.print(
                f"Please create the release manually here: https://github.com/pklatka/modernblog/releases/new?tag=v{new_version}"
            )

    console.print(f"[bold green]Done! Version {new_version} released.[/bold green]")


if __name__ == "__main__":
    main()
