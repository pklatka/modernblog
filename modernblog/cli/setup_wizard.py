"""Interactive setup wizard for ModernBlog."""

import secrets
from pathlib import Path
from typing import Optional

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt

from modernblog.backend.config import (
    get_config_path,
    get_default_config_dir,
    save_config,
)
from modernblog.backend.security import hash_password

console = Console()


def run_setup_wizard(config_dir: Optional[str] = None) -> None:
    """Run the interactive setup wizard."""
    console.print()
    console.print(
        Panel.fit(
            "[bold blue]Welcome to ModernBlog Setup[/bold blue]\n\n"
            "This wizard will help you configure your blog.\n"
            "You can change these settings later by running [bold]modernblog setup[/bold] again.",
            border_style="blue",
        )
    )
    console.print()

    # Check if config already exists
    config_path = get_config_path(config_dir)
    if config_path.exists():
        if not Confirm.ask(
            "[yellow]Configuration already exists. Do you want to reconfigure?[/yellow]"
        ):
            console.print("[green]Setup cancelled.[/green]")
            return

    config = {}

    # Basic Information
    console.print("\n[bold cyan]📝 Basic Information[/bold cyan]\n")

    config["blog_title"] = Prompt.ask("Blog title", default="My Blog")

    config["blog_description"] = Prompt.ask(
        "Blog description", default="A personal blog powered by ModernBlog"
    )

    config["author_name"] = Prompt.ask("Your name", default="Anonymous")

    config["author_bio"] = Prompt.ask("Short bio", default="")

    # Optional features
    console.print("\n[bold cyan]🔗 Optional Features[/bold cyan]\n")

    config["github_sponsor_url"] = Prompt.ask(
        "GitHub Sponsors URL (leave empty to disable)", default=""
    )

    # SEO
    console.print("\n[bold cyan]🔍 SEO Settings[/bold cyan]\n")

    config["site_url"] = Prompt.ask(
        "Site URL for SEO (e.g., https://myblog.com)", default=""
    )

    # Security
    console.print("\n[bold cyan]🔒 Security[/bold cyan]\n")

    # Generate a secure password or let user choose
    default_password = secrets.token_urlsafe(16)

    console.print("\n[bold yellow]⚠️  IMPORTANT: Admin Password[/bold yellow]")
    console.print(
        f"I've generated a secure password for you: [bold green]{default_password}[/bold green]"
    )
    console.print("You can press Enter to keep this password, or type a new one.")

    password = Prompt.ask("Admin password", default=default_password, password=True)

    if password == default_password:
        console.print(
            f"\n[bold green]Using generated password: {password}[/bold green]"
        )
        console.print(
            "[bold red]Please save this password now! You won't be able to see it again.[/bold red]"
        )

    # Store the hash, not the password
    config["admin_password_hash"] = hash_password(password)

    # Generate secret key for JWT
    config["secret_key"] = secrets.token_urlsafe(32)

    # Moderation
    console.print("\n[bold cyan]🛡️ Moderation[/bold cyan]\n")

    config["comment_approval_required"] = Confirm.ask(
        "Require admin approval for new comments?", default=False
    )

    # Data directory
    console.print("\n[bold cyan]📁 Data Storage[/bold cyan]\n")

    default_data_dir = str(get_default_config_dir() / "data")
    config["data_dir"] = Prompt.ask(
        "Data directory (database and uploads)", default=default_data_dir
    )

    # Internationalization
    console.print("\n[bold cyan]🌐 Internationalization[/bold cyan]\n")
    console.print("[dim]Available languages: English (en), Polish (pl)[/dim]\n")

    i18n = {}
    supported_langs_input = Prompt.ask(
        "Language (en, pl)", default="en", choices=["en", "pl"]
    )
    selected_language = supported_langs_input.strip().lower()

    i18n["language"] = selected_language

    config["i18n"] = i18n

    # Theme customization
    console.print("\n[bold cyan]🎨 Theme Selection[/bold cyan]\n")
    console.print("[dim]Choose a color theme for your blog:[/dim]\n")

    # Import themes to get the available options
    from modernblog.backend.themes import THEMES

    # Display theme options
    for i, (key, theme) in enumerate(THEMES.items(), 1):
        console.print(f"  [bold]{i}.[/bold] {theme['name']} - {theme['description']}")

    console.print()

    theme_choices = list(THEMES.keys())
    theme_input = Prompt.ask(
        "Select theme",
        choices=[str(i) for i in range(1, len(theme_choices) + 1)],
        default="1",
    )

    selected_theme = theme_choices[int(theme_input) - 1]
    config["theme"] = {"name": selected_theme}

    # Newsletter/Email configuration
    console.print("\n[bold cyan]📧 Email Notifications (Optional)[/bold cyan]\n")
    console.print(
        "[dim]Enable email subscriptions and notifications for your blog[/dim]\n"
    )

    if Confirm.ask("Would you like to enable email notifications?", default=False):
        console.print("\n[dim]Choose how to send emails to subscribers:[/dim]")
        console.print("  1. Direct SMTP - Send individual emails to each subscriber")
        console.print("  2. Mailing List - Use a Majordomo mailing list\n")

        email_method = Prompt.ask("Email method", choices=["1", "2"], default="1")

        if email_method == "2":
            # Mailing list configuration
            console.print("\n[bold]Mailing List Configuration[/bold]\n")

            mailing_list = {"enabled": True}

            mailing_list["domain"] = Prompt.ask(
                "Mailing list domain (e.g., lists.example.com)"
            )

            mailing_list["name"] = Prompt.ask(
                "Mailing list name (e.g., blog-subscribers)"
            )

            mailing_list["password"] = Prompt.ask(
                "Majordomo approval password", password=True
            )

            config["mailing_list"] = mailing_list

            # Still need SMTP for sending to mailing list
            console.print(
                "\n[dim]SMTP settings are still required to send emails to the mailing list[/dim]\n"
            )

        # SMTP configuration (needed for both methods)
        console.print("\n[bold]SMTP Configuration[/bold]\n")

        smtp = {}

        smtp["host"] = Prompt.ask("SMTP server host (e.g., smtp.gmail.com)")

        smtp["port"] = int(Prompt.ask("SMTP port", default="587"))

        smtp["user"] = Prompt.ask(
            "SMTP username (often your email address)", default=""
        )

        if smtp["user"]:
            smtp["password"] = Prompt.ask("SMTP password", password=True)

        smtp["from_email"] = Prompt.ask("From email address (sender address)")

        smtp["from_name"] = Prompt.ask(
            "From name", default=config.get("blog_title", "ModernBlog")
        )

        config["smtp"] = smtp

    # Save configuration
    save_config(config, config_dir)

    # Create data directory
    data_dir = Path(config["data_dir"])
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "uploads").mkdir(exist_ok=True)

    # Success message
    console.print()
    console.print(
        Panel.fit(
            f"[bold green]✓ Setup complete![/bold green]\n\n"
            f"Configuration saved to: [cyan]{config_path}[/cyan]\n"
            f"Data directory: [cyan]{data_dir}[/cyan]\n\n"
            f"[bold]Next steps:[/bold]\n"
            f"  1. Run [bold]modernblog run[/bold] to start your blog\n"
            f"  2. Visit [bold]http://localhost:8080[/bold] to see your blog\n"
            f"  3. Visit [bold]http://localhost:8080/admin[/bold] to manage posts\n\n"
            f"[dim]Admin password configured securely[/dim]",
            border_style="green",
        )
    )
    console.print()
