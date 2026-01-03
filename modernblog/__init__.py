"""ModernBlog - A self-hosted, modern blogging platform."""

__version__ = "1.0.0"
__author__ = "Patryk Klatka"

# Re-export CLI for entry point
from .cli.cli import cli

__all__ = ["cli", "__version__"]
