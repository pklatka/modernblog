"""Predefined themes for ModernBlog."""

from typing import Any, Dict

# Theme definitions with light and dark mode colors
THEMES: Dict[str, Dict[str, Any]] = {
    "modern": {
        "name": "Modern",
        "description": "Clean, neutral design with stone backgrounds",
        "light": {
            "bg_primary": "#fafaf9",
            "bg_secondary": "#f5f5f4",
            "bg_tertiary": "#e7e5e4",
            "bg_card": "#ffffff",
            "bg_code": "#1e1e2e",
            "text_primary": "#1c1917",
            "text_secondary": "#44403c",
            "text_tertiary": "#78716c",
            "text_muted": "#a8a29e",
            "border": "#e7e5e4",
            "border_hover": "#d6d3d1",
            "accent": "#b45309",
            "accent_hover": "#92400e",
            "accent_light": "#fef3c7",
            "link": "#0369a1",
            "link_hover": "#0284c7",
        },
        "dark": {
            "bg_primary": "#0f0f0f",
            "bg_secondary": "#171717",
            "bg_tertiary": "#262626",
            "bg_card": "#1a1a1a",
            "bg_code": "#0d0d0d",
            "text_primary": "#fafaf9",
            "text_secondary": "#d6d3d1",
            "text_tertiary": "#a8a29e",
            "text_muted": "#78716c",
            "border": "#2e2e2e",
            "border_hover": "#404040",
            "accent": "#f59e0b",
            "accent_hover": "#fbbf24",
            "accent_light": "#451a03",
            "link": "#38bdf8",
            "link_hover": "#7dd3fc",
        },
    },
    "amber": {
        "name": "Amber",
        "description": "Warm, earthy tones with amber accents",
        "light": {
            "bg_primary": "#fffbeb",
            "bg_secondary": "#fef3c7",
            "bg_tertiary": "#fde68a",
            "bg_card": "#ffffff",
            "bg_code": "#292524",
            "text_primary": "#1c1917",
            "text_secondary": "#44403c",
            "text_tertiary": "#78716c",
            "text_muted": "#a8a29e",
            "border": "#fde68a",
            "border_hover": "#fcd34d",
            "accent": "#b45309",
            "accent_hover": "#92400e",
            "accent_light": "#fef3c7",
            "link": "#d97706",
            "link_hover": "#b45309",
        },
        "dark": {
            "bg_primary": "#0c0a09",
            "bg_secondary": "#1c1917",
            "bg_tertiary": "#292524",
            "bg_card": "#1c1917",
            "bg_code": "#0c0a09",
            "text_primary": "#fafaf9",
            "text_secondary": "#d6d3d1",
            "text_tertiary": "#a8a29e",
            "text_muted": "#78716c",
            "border": "#44403c",
            "border_hover": "#57534e",
            "accent": "#f59e0b",
            "accent_hover": "#fbbf24",
            "accent_light": "#451a03",
            "link": "#fbbf24",
            "link_hover": "#fcd34d",
        },
    },
    "ocean": {
        "name": "Ocean",
        "description": "Cool blue tones inspired by the sea",
        "light": {
            "bg_primary": "#f0f9ff",
            "bg_secondary": "#e0f2fe",
            "bg_tertiary": "#bae6fd",
            "bg_card": "#ffffff",
            "bg_code": "#0c4a6e",
            "text_primary": "#0c4a6e",
            "text_secondary": "#075985",
            "text_tertiary": "#0369a1",
            "text_muted": "#0284c7",
            "border": "#bae6fd",
            "border_hover": "#7dd3fc",
            "accent": "#0284c7",
            "accent_hover": "#0369a1",
            "accent_light": "#e0f2fe",
            "link": "#0369a1",
            "link_hover": "#075985",
        },
        "dark": {
            "bg_primary": "#0c1929",
            "bg_secondary": "#0f2942",
            "bg_tertiary": "#164e63",
            "bg_card": "#0f2942",
            "bg_code": "#082f49",
            "text_primary": "#f0f9ff",
            "text_secondary": "#e0f2fe",
            "text_tertiary": "#bae6fd",
            "text_muted": "#7dd3fc",
            "border": "#164e63",
            "border_hover": "#155e75",
            "accent": "#38bdf8",
            "accent_hover": "#7dd3fc",
            "accent_light": "#082f49",
            "link": "#7dd3fc",
            "link_hover": "#bae6fd",
        },
    },
    "forest": {
        "name": "Forest",
        "description": "Natural green tones with earthy accents",
        "light": {
            "bg_primary": "#f0fdf4",
            "bg_secondary": "#dcfce7",
            "bg_tertiary": "#bbf7d0",
            "bg_card": "#ffffff",
            "bg_code": "#14532d",
            "text_primary": "#14532d",
            "text_secondary": "#166534",
            "text_tertiary": "#15803d",
            "text_muted": "#22c55e",
            "border": "#bbf7d0",
            "border_hover": "#86efac",
            "accent": "#15803d",
            "accent_hover": "#166534",
            "accent_light": "#dcfce7",
            "link": "#047857",
            "link_hover": "#065f46",
        },
        "dark": {
            "bg_primary": "#052e16",
            "bg_secondary": "#14532d",
            "bg_tertiary": "#166534",
            "bg_card": "#14532d",
            "bg_code": "#022c22",
            "text_primary": "#f0fdf4",
            "text_secondary": "#dcfce7",
            "text_tertiary": "#bbf7d0",
            "text_muted": "#86efac",
            "border": "#166534",
            "border_hover": "#15803d",
            "accent": "#4ade80",
            "accent_hover": "#86efac",
            "accent_light": "#052e16",
            "link": "#34d399",
            "link_hover": "#6ee7b7",
        },
    },
    "rose": {
        "name": "Rose",
        "description": "Soft pink and rose tones for a warm aesthetic",
        "light": {
            "bg_primary": "#fff1f2",
            "bg_secondary": "#ffe4e6",
            "bg_tertiary": "#fecdd3",
            "bg_card": "#ffffff",
            "bg_code": "#881337",
            "text_primary": "#881337",
            "text_secondary": "#9f1239",
            "text_tertiary": "#be123c",
            "text_muted": "#e11d48",
            "border": "#fecdd3",
            "border_hover": "#fda4af",
            "accent": "#be185d",
            "accent_hover": "#9d174d",
            "accent_light": "#fce7f3",
            "link": "#db2777",
            "link_hover": "#be185d",
        },
        "dark": {
            "bg_primary": "#1c0a0f",
            "bg_secondary": "#4c0519",
            "bg_tertiary": "#881337",
            "bg_card": "#4c0519",
            "bg_code": "#1c0a0f",
            "text_primary": "#fff1f2",
            "text_secondary": "#ffe4e6",
            "text_tertiary": "#fecdd3",
            "text_muted": "#fda4af",
            "border": "#881337",
            "border_hover": "#9f1239",
            "accent": "#fb7185",
            "accent_hover": "#fda4af",
            "accent_light": "#4c0519",
            "link": "#f472b6",
            "link_hover": "#f9a8d4",
        },
    },
    "slate": {
        "name": "Slate",
        "description": "Neutral gray tones for a professional look",
        "light": {
            "bg_primary": "#f8fafc",
            "bg_secondary": "#f1f5f9",
            "bg_tertiary": "#e2e8f0",
            "bg_card": "#ffffff",
            "bg_code": "#1e293b",
            "text_primary": "#0f172a",
            "text_secondary": "#334155",
            "text_tertiary": "#64748b",
            "text_muted": "#94a3b8",
            "border": "#e2e8f0",
            "border_hover": "#cbd5e1",
            "accent": "#475569",
            "accent_hover": "#334155",
            "accent_light": "#f1f5f9",
            "link": "#475569",
            "link_hover": "#334155",
        },
        "dark": {
            "bg_primary": "#0f172a",
            "bg_secondary": "#1e293b",
            "bg_tertiary": "#334155",
            "bg_card": "#1e293b",
            "bg_code": "#0f172a",
            "text_primary": "#f8fafc",
            "text_secondary": "#e2e8f0",
            "text_tertiary": "#cbd5e1",
            "text_muted": "#94a3b8",
            "border": "#334155",
            "border_hover": "#475569",
            "accent": "#94a3b8",
            "accent_hover": "#cbd5e1",
            "accent_light": "#1e293b",
            "link": "#94a3b8",
            "link_hover": "#cbd5e1",
        },
    },
}


DEFAULT_THEME = "modern"


def get_theme(theme_name: str) -> Dict[str, Any]:
    """Get a theme by name, falling back to default if not found."""
    return THEMES.get(theme_name.lower(), THEMES[DEFAULT_THEME])


def get_theme_names() -> list:
    """Get list of available theme names."""
    return list(THEMES.keys())


def get_theme_css(theme_name: str) -> str:
    """Generate CSS variables for a theme."""
    theme = get_theme(theme_name)
    light = theme["light"]
    dark = theme["dark"]

    light_css = f""":root {{
  --color-bg-primary: {light["bg_primary"]};
  --color-bg-secondary: {light["bg_secondary"]};
  --color-bg-tertiary: {light["bg_tertiary"]};
  --color-bg-card: {light["bg_card"]};
  --color-bg-code: {light["bg_code"]};
  --color-text-primary: {light["text_primary"]};
  --color-text-secondary: {light["text_secondary"]};
  --color-text-tertiary: {light["text_tertiary"]};
  --color-text-muted: {light["text_muted"]};
  --color-border: {light["border"]};
  --color-border-hover: {light["border_hover"]};
  --color-accent: {light["accent"]};
  --color-accent-hover: {light["accent_hover"]};
  --color-accent-light: {light["accent_light"]};
  --color-link: {light["link"]};
  --color-link-hover: {light["link_hover"]};
  --color-success: #15803d;
  --color-error: #b91c1c;
}}"""

    dark_css = f"""[data-theme="dark"] {{
  --color-bg-primary: {dark["bg_primary"]};
  --color-bg-secondary: {dark["bg_secondary"]};
  --color-bg-tertiary: {dark["bg_tertiary"]};
  --color-bg-card: {dark["bg_card"]};
  --color-bg-code: {dark["bg_code"]};
  --color-text-primary: {dark["text_primary"]};
  --color-text-secondary: {dark["text_secondary"]};
  --color-text-tertiary: {dark["text_tertiary"]};
  --color-text-muted: {dark["text_muted"]};
  --color-border: {dark["border"]};
  --color-border-hover: {dark["border_hover"]};
  --color-accent: {dark["accent"]};
  --color-accent-hover: {dark["accent_hover"]};
  --color-accent-light: {dark["accent_light"]};
  --color-link: {dark["link"]};
  --color-link-hover: {dark["link_hover"]};
  --color-success: #22c55e;
  --color-error: #ef4444;
}}"""

    return f"{light_css}\n\n{dark_css}"
