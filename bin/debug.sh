#!/bin/bash

# Nowa Desktop - Debug script

EXTENSION_UUID="nowa-desktop@extensions.gnome.org"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SCHEMA="org.gnome.shell.extensions.nowa-topbar"

# Color codes
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "======================================"
echo "Nowa Desktop - Debugger"
echo "======================================"
echo ""

# Check if extension is installed
if [ -d "$EXTENSION_DIR" ]; then
  echo -e "${GREEN}✓ Extension directory exists${NC}"
else
  echo "✗ Extension directory NOT found"
  exit 1
fi

# Check if enabled
if gnome-extensions list --enabled | grep -q "$EXTENSION_UUID"; then
  echo -e "${GREEN}✓ Extension is ENABLED${NC}"
else
  echo "✗ Extension is DISABLED"
  echo "  Run: gnome-extensions enable $EXTENSION_UUID"
  exit 1
fi

# Current wallpaper
WALLPAPER=$(gsettings get org.gnome.desktop.background picture-uri 2>/dev/null || echo "unknown")
echo ""
echo "- Current Wallpaper: $WALLPAPER"

echo ""
echo "======================================"
echo "📋 Live Logs (Ctrl+C to stop):"
echo "======================================"
echo ""
echo "Looking for 'Nowa Desktop' messages..."
echo ""

journalctl -f -o cat /usr/bin/gnome-shell 2>/dev/null | grep --line-buffered "Nowa Desktop" | sed 's/Nowa Desktop: //'

