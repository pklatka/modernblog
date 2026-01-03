"""Configuration management for ModernBlog."""

import json
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


def get_default_config_dir() -> Path:
    """Get the default configuration directory."""
    return Path.home() / ".modernblog"


def get_config_path(config_dir: Optional[str] = None) -> Path:
    """Get the path to the configuration file."""
    if config_dir:
        return Path(config_dir) / "config.json"
    return get_default_config_dir() / "config.json"


def get_data_dir(config_dir: Optional[str] = None) -> Path:
    """Get the data directory for database and uploads."""
    cfg = load_config(config_dir)
    if cfg.get("data_dir"):
        return Path(cfg["data_dir"])
    if config_dir:
        return Path(config_dir) / "data"
    return get_default_config_dir() / "data"


def load_config(config_dir: Optional[str] = None) -> dict:
    """Load configuration from file."""
    config_path = get_config_path(config_dir)
    if config_path.exists():
        with open(config_path, "r") as f:
            return json.load(f)
    return {}


def save_config(config: dict, config_dir: Optional[str] = None) -> None:
    """Save configuration to file."""
    config_path = get_config_path(config_dir)
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)


def config_exists(config_dir: Optional[str] = None) -> bool:
    """Check if configuration file exists."""
    return get_config_path(config_dir).exists()


class Settings(BaseSettings):
    """Application settings loaded from config file."""

    # Blog settings
    BLOG_TITLE: str = "My Blog"
    BLOG_DESCRIPTION: str = "A personal blog powered by ModernBlog"
    AUTHOR_NAME: str = "Anonymous"
    AUTHOR_BIO: str = ""
    GITHUB_SPONSOR_URL: str = ""

    # Image settings
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
    UPLOAD_DIR: str = "uploads"

    # Admin settings
    ADMIN_PASSWORD_HASH: str = ""
    SECRET_KEY: str = "change-me-in-setup"

    # Theme settings
    THEME_NAME: str = "amber"

    # SMTP settings for email notifications
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "ModernBlog"

    # Mailing list settings (Majordomo)
    MAILING_LIST_ENABLED: bool = False  # Use mailing list instead of direct emails
    MAILING_LIST_DOMAIN: Optional[str] = None  # e.g., "lists.example.com"
    MAILING_LIST_NAME: Optional[str] = None  # e.g., "blog-subscribers"
    MAILING_LIST_PASSWORD: Optional[str] = None  # Majordomo approval password

    # Internationalization settings
    LANGUAGE: str = "en"  # Language code (e.g., "en", "pl")

    # Rate limiting settings
    RATE_LIMIT_WINDOW: int = 300  # 5 minutes
    RATE_LIMIT_MAX_COMMENTS: int = 5
    MIN_FORM_TIME_SECONDS: int = 3  # Minimum time between form render and submit

    # Global Rate Limiting
    GLOBAL_RATE_LIMIT_COUNT: int = 1000
    GLOBAL_RATE_LIMIT_WINDOW_SECONDS: int = 3600  # 1 hour

    # Comment settings
    COMMENT_APPROVAL_REQUIRED: bool = False

    class Config:
        env_file = ".env"

    @classmethod
    def from_config_file(cls, config_dir: Optional[str] = None) -> "Settings":
        """Load settings from config file."""
        cfg = load_config(config_dir)

        # Map config file keys to settings
        settings_dict = {
            "BLOG_TITLE": cfg.get("blog_title", cls.model_fields["BLOG_TITLE"].default),
            "BLOG_DESCRIPTION": cfg.get(
                "blog_description", cls.model_fields["BLOG_DESCRIPTION"].default
            ),
            "AUTHOR_NAME": cfg.get(
                "author_name", cls.model_fields["AUTHOR_NAME"].default
            ),
            "AUTHOR_BIO": cfg.get("author_bio", cls.model_fields["AUTHOR_BIO"].default),
            "GITHUB_SPONSOR_URL": cfg.get(
                "github_sponsor_url", cls.model_fields["GITHUB_SPONSOR_URL"].default
            ),
            "ADMIN_PASSWORD_HASH": cfg.get(
                "admin_password_hash", cls.model_fields["ADMIN_PASSWORD_HASH"].default
            ),
            "SECRET_KEY": cfg.get("secret_key", cls.model_fields["SECRET_KEY"].default),
            "COMMENT_APPROVAL_REQUIRED": cfg.get(
                "comment_approval_required",
                cls.model_fields["COMMENT_APPROVAL_REQUIRED"].default,
            ),
        }

        # Theme settings
        theme = cfg.get("theme", {})
        if theme.get("name"):
            settings_dict["THEME_NAME"] = theme["name"]

        # SMTP settings
        smtp = cfg.get("smtp", {})
        if smtp.get("host"):
            settings_dict["SMTP_HOST"] = smtp["host"]
        if smtp.get("port"):
            settings_dict["SMTP_PORT"] = smtp["port"]
        if smtp.get("user"):
            settings_dict["SMTP_USER"] = smtp["user"]
        if smtp.get("password"):
            settings_dict["SMTP_PASSWORD"] = smtp["password"]
        if smtp.get("from_email"):
            settings_dict["SMTP_FROM_EMAIL"] = smtp["from_email"]
        if smtp.get("from_name"):
            settings_dict["SMTP_FROM_NAME"] = smtp["from_name"]

        # Mailing list settings (Majordomo)
        mailing_list = cfg.get("mailing_list", {})
        if mailing_list.get("enabled"):
            settings_dict["MAILING_LIST_ENABLED"] = mailing_list["enabled"]
        if mailing_list.get("domain"):
            settings_dict["MAILING_LIST_DOMAIN"] = mailing_list["domain"]
        if mailing_list.get("name"):
            settings_dict["MAILING_LIST_NAME"] = mailing_list["name"]
        if mailing_list.get("password"):
            settings_dict["MAILING_LIST_PASSWORD"] = mailing_list["password"]

        # Internationalization settings
        i18n = cfg.get("i18n", {})
        if i18n.get("language"):
            settings_dict["LANGUAGE"] = i18n["language"]
        # Backwards compatibility: support old format
        elif i18n.get("default_language"):
            settings_dict["LANGUAGE"] = i18n["default_language"]

        # Data directory for uploads
        data_dir = get_data_dir(config_dir)
        settings_dict["UPLOAD_DIR"] = str(data_dir / "uploads")

        return cls(**settings_dict)


# Global settings instance
settings: Optional[Settings] = None


def init_settings(config_dir: Optional[str] = None) -> Settings:
    """Initialize global settings from config file."""
    global settings
    settings = Settings.from_config_file(config_dir)
    return settings


def get_settings() -> Settings:
    """Get current settings, initialize if needed."""
    global settings
    if settings is None:
        settings = Settings.from_config_file()
    return settings
