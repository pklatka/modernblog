#!/bin/sh

set -e

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'

REPO="pklatka/modernblog"
GITHUB_API="https://api.github.com/repos/$REPO/releases/latest"
GITHUB_RELEASES="https://github.com/$REPO/releases"

log_info() {
    printf "${BLUE}${BOLD}==>${RESET} ${BOLD}%s${RESET}\n" "$1"
}

log_success() {
    printf "${GREEN}${BOLD}==>${RESET} ${BOLD}%s${RESET}\n" "$1"
}

log_warn() {
    printf "${YELLOW}${BOLD}==>${RESET} ${BOLD}%s${RESET}\n" "$1"
}

log_error() {
    printf "${RED}${BOLD}==>${RESET} ${BOLD}Error:${RESET} %s\n" "$1"
    exit 1
}

# Detect download tool
if command -v curl >/dev/null 2>&1; then
    DOWNLOAD_CMD="curl -fsSL"
    DOWNLOAD_OUTPUT="-o"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOAD_CMD="wget -qO-"
    DOWNLOAD_OUTPUT="-O"
else
    log_error "Neither curl nor wget found. Please install one of them."
fi

# Check for Python 3.11+
if ! command -v python3 >/dev/null 2>&1; then
    log_error "Python 3 is required but not found."
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$MAJOR" -lt 3 ] || ([ "$MAJOR" -eq 3 ] && [ "$MINOR" -lt 11 ]); then
    log_error "ModernBlog requires Python 3.11 or newer. Found version $PYTHON_VERSION"
fi

INSTALL_DIR="$HOME/.local/share/modernblog"
BIN_DIR="$HOME/.local/bin"
VENV_DIR="$INSTALL_DIR/venv"
TMP_DIR=$(mktemp -d)

cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

log_info "Fetching latest release..."

# Get latest release info from GitHub API
if command -v curl >/dev/null 2>&1; then
    RELEASE_JSON=$(curl -fsSL "$GITHUB_API" 2>/dev/null) || {
        log_error "Failed to fetch release info. Check your internet connection."
    }
else
    RELEASE_JSON=$(wget -qO- "$GITHUB_API" 2>/dev/null) || {
        log_error "Failed to fetch release info. Check your internet connection."
    }
fi

# Extract wheel URL from release assets (look for .whl file)
WHEEL_URL=$(echo "$RELEASE_JSON" | grep -o '"browser_download_url": *"[^"]*\.whl"' | head -1 | sed 's/.*"\(http[^"]*\)".*/\1/')

if [ -z "$WHEEL_URL" ]; then
    log_warn "No wheel found in latest release. Falling back to source install..."
    USE_SOURCE=true
else
    USE_SOURCE=false
    # Extract version from release
    VERSION=$(echo "$RELEASE_JSON" | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/' | sed 's/^v//')
    log_info "Found ModernBlog version: $VERSION"
fi

log_info "Installing ModernBlog to $INSTALL_DIR..."

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"

# Create virtual environment
if [ ! -d "$VENV_DIR" ]; then
    log_info "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Upgrade pip
"$VENV_DIR/bin/pip" install --upgrade pip --quiet

if [ "$USE_SOURCE" = "true" ]; then
    # Fallback: install from git (heavier, but works if no releases)
    log_info "Installing from source..."
    "$VENV_DIR/bin/pip" install "git+https://github.com/$REPO.git" --quiet
else
    # Download and install wheel (lightweight)
    log_info "Downloading wheel package..."
    WHEEL_NAME=$(basename "$WHEEL_URL")
    WHEEL_FILE="$TMP_DIR/$WHEEL_NAME"
    
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$WHEEL_URL" -o "$WHEEL_FILE" || log_error "Failed to download wheel."
    else
        wget -q "$WHEEL_URL" -O "$WHEEL_FILE" || log_error "Failed to download wheel."
    fi
    
    log_info "Installing ModernBlog..."
    "$VENV_DIR/bin/pip" install "$WHEEL_FILE" --quiet
fi

# Create symlink
APP_PATH="$VENV_DIR/bin/modernblog"
LINK_PATH="$BIN_DIR/modernblog"

if [ -e "$LINK_PATH" ] || [ -L "$LINK_PATH" ]; then
    log_info "Removing existing binary at $LINK_PATH"
    rm -f "$LINK_PATH"
fi

ln -s "$APP_PATH" "$LINK_PATH"

log_success "ModernBlog installed successfully!"

# Check PATH
case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *)
        echo ""
        log_warn "The directory $BIN_DIR is not in your PATH."
        echo "Please add the following line to your shell configuration file (.bashrc, .zshrc, etc.):"
        echo ""
        echo "  export PATH=\"$BIN_DIR:\$PATH\""
        echo ""
        ;;
esac

echo "Run 'modernblog --help' to get started."
