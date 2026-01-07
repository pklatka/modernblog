"""ModernBlog - A self-hosted, modern blogging platform."""

from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("modernblog")
except PackageNotFoundError:
    __version__ = "?.?.?"

__author__ = "Patryk Klatka"

# Re-export CLI for entry point
from .cli.cli import cli

__all__ = ["cli", "__version__"]
