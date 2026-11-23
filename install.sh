#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$ROOT/cursor-switch" "$ROOT/install.sh"
mkdir -p "$HOME/.local/bin" "$HOME/.cursor/extensions"
ln -sfn "$ROOT/cursor-switch" "$HOME/.local/bin/cursor-switch"
ln -sfn "$ROOT" "$HOME/.cursor/extensions/emotreew.cursor-switch-0.0.1"
echo "CLI: $HOME/.local/bin/cursor-switch"
echo "Extension: $HOME/.cursor/extensions/emotreew.cursor-switch-0.0.1"
echo "Reload the Cursor window (Command Palette → Developer: Reload Window)."
echo "Then click the account chip on the status bar, or run Cursor Switch: Toggle Account."
