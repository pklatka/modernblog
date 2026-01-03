"""Custom hatchling build hook to build frontend before packaging."""

import subprocess
import sys
from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class FrontendBuildHook(BuildHookInterface):
    """Build hook that compiles the frontend before packaging."""

    PLUGIN_NAME = "frontend-builder"

    def initialize(self, version: str, build_data: dict) -> None:
        """Run frontend build before the wheel is created."""
        frontend_dir = Path(self.root) / "modernblog" / "frontend"
        dist_dir = frontend_dir / "dist"

        # Skip if dist already exists and we're in development
        if dist_dir.exists() and any(dist_dir.iterdir()):
            self.app.display_info("Frontend dist already exists, skipping build")
        else:
            self.app.display_info("Building frontend...")

            # Check if node_modules exists, if not run npm install
            node_modules = frontend_dir / "node_modules"
            if not node_modules.exists():
                self.app.display_info("Installing frontend dependencies...")
                subprocess.run(
                    ["npm", "install"],
                    cwd=frontend_dir,
                    check=True,
                    stdout=sys.stdout,
                    stderr=sys.stderr,
                )

            # Run npm build
            self.app.display_info("Running npm build...")
            subprocess.run(
                ["npm", "run", "build"],
                cwd=frontend_dir,
                check=True,
                stdout=sys.stdout,
                stderr=sys.stderr,
            )

            self.app.display_info("Frontend build complete!")
