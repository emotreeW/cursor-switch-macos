# cursor-switch

One macOS CLI and one Cursor extension for the two logins on this machine. Keep them in **this repository**. Do not split “open the other window”, chat sync, login swap, and DeepSeek into separate GitHub repos or separate extensions.

Unofficial. Cursor can change this storage in any release.

## Install

```bash
./install.sh
```

Reload the Cursor window (`Developer: Reload Window`). The account chip on the status bar opens a menu:

- **Open other window** — keep this window; focus the other account or launch it. Super uses the default data dir; Pro+ uses `--user-data-dir` `~/Library/Application Support/Cursor-ProPlus`. Never launches a second copy of the default dir (two writers on one `state.vscdb` corrupt it).
- **Sync chats** — copy this workspace's recently used threads (full history) into the other account, then quit and reopen **that** window only.
- **Switch login** — quit this window and swap the login inside the default data dir.

A second chip shows **Grok** or **DeepSeek** and clicks Cursor's own `Toggle OpenAI key` (`Cmd+Shift+0`). Cursor still has no per-model base URL: Grok and DeepSeek cannot stay on at the same time. After a toggle, pick the matching model in the current chat.

**Sync** copies every chat in this workspace whose thread was used in the last 7 days, including the full history of that thread. It does not copy other workspaces, and it does not copy threads that sat idle for more than 7 days. If the payload would exceed 80 MB it keeps the newest threads and can fall back to “used in the last 4 days”. The other Cursor window is quit, its database is written, then that window is relaunched. This window stays open. Two Cursors never write the same `state.vscdb` at once. If the destination already has a newer copy of the same chat, that copy is left alone. Replaced destination rows are saved under `~/.config/cursor-switch/sync/backups/`. Workspace files on disk are not part of this sync.

Command Palette:

- `Cursor Switch: Account Menu`
- `Cursor Switch: Open Other Window`
- `Cursor Switch: Toggle Account`
- `Cursor Switch: Switch to Super`
- `Cursor Switch: Switch to Pro+`
- `Cursor Switch: Toggle DeepSeek / Grok`
- `Cursor Switch: Sync This Workspace's Recent Chats`

First-time capture (already done on this machine):

```bash
cursor-switch capture super
cursor-switch capture proplus --from "$HOME/Library/Application Support/Cursor-ProPlus"
```

CLI:

```bash
cursor-switch open-other --from-dir "$HOME/Library/Application Support/Cursor" --folder "$PWD"
cursor-switch toggle
cursor-switch sync-chats \
  --from-dir "$HOME/Library/Application Support/Cursor" \
  --to-dir "$HOME/Library/Application Support/Cursor-ProPlus" \
  --folder "$PWD" \
  --days 7 \
  --max-mb 80
```

Add `--dry-run` to print the chat list without writing.

## Prior art

| Repo | What it does | Gap |
| --- | --- | --- |
| [xorostar/multicursor](https://github.com/xorostar/multicursor) | Mac menu bar; writes `cursorAuth/*` plus Keychain, then restarts Cursor | Captures only from the default data dir; cannot import a second `--user-data-dir` |
| [keyBeatz/cursor-switch](https://github.com/keyBeatz/cursor-switch) | Same idea: swap tokens, keep chats | Linux only |
| [reloadlife/cursor-account-switcher](https://github.com/reloadlife/cursor-account-switcher) | Multi-tool CLI (Cursor / Claude / Codex) | Does not import an already-signed-in second user-data-dir |

This tool follows the same public method: replace `cursorAuth/%` and `glass.lastSignedInAuthId` in the default `state.vscdb`. It can also capture a session from a second data dir such as `~/Library/Application Support/Cursor-ProPlus`.

## Paths

- Chats and current login: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- Captured sessions (local, not in git): `~/.config/cursor-switch/accounts/`
- Optional second instance: `~/Library/Application Support/Cursor-ProPlus`

## License

MIT
