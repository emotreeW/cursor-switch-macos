# cursor-switch

macOS CLI plus one Cursor extension. All of it lives in this repo: opening the other window, copying chats, swapping the default login, and the DeepSeek / Grok chip.

Unofficial. Cursor can change how it stores logins and chats.

## Two accounts

| | Super | Pro+ |
| --- | --- | --- |
| Typical email | Gmail login | QQ login |
| Data dir | `~/Library/Application Support/Cursor` | `~/Library/Application Support/Cursor-ProPlus` |
| How it runs | Normal Cursor (this window) | Second instance with `--user-data-dir` |

Do not start a second copy of the default dir. Two writers on one `state.vscdb` can corrupt it.

## Install

```bash
./install.sh
```

Then **Developer: Reload Window**.

First-time login capture (already done on this machine):

```bash
cursor-switch capture super
cursor-switch capture proplus --from "$HOME/Library/Application Support/Cursor-ProPlus"
```

Saved sessions stay in `~/.config/cursor-switch/accounts/` (not in git).

## Status bar

After reload you should see two chips at the bottom right.

**Account chip** (`super` / `proplus`) — click it, then pick one:

1. **Open other window**  
   This window stays. If the other account is already running, it comes to the front. If not, Pro+ launches with `--user-data-dir` pointing at `Cursor-ProPlus`. It does not open a second Super.

2. **Sync chats**  
   Copies chats **from Super into Pro+ only**. It never writes Super’s chat tables.  
   Which chats: this workspace, threads that were used in the last 7 days, **full history of each of those threads** (not “only the last 7 days of messages”). Idle threads and other folders are skipped. If the bundle would exceed 80 MB, it keeps the newest threads and may use 4 days.  
   Pro+ is quit, its database is written, then Pro+ reopens. Super stays open.  
   If Pro+ already has the same thread and that copy is newer, that copy is left alone. Rows that do get replaced are saved under `~/.config/cursor-switch/sync/backups/`.  
   Project files on disk are not copied.

3. **Switch login**  
   Quits **this** (default) Cursor, replaces only `cursorAuth/%` and `glass.lastSignedInAuthId` in the default `state.vscdb`, then relaunches Super. Chat tables are not deleted. Pro+ is not quit.

**Grok / DeepSeek chip** — clicks Cursor’s own `Toggle OpenAI key` (`Cmd+Shift+0`). That override is global: with it on, Grok is sent to your DeepSeek endpoint. After a toggle, pick `deepseek-flash` or Grok in the current chat. This chip does not open a new chat and does not write chat tables.

Command Palette names match the same actions (`Cursor Switch: …`).

## CLI

```bash
cursor-switch status --json
cursor-switch open-other --from-dir "$HOME/Library/Application Support/Cursor" --folder "$PWD"
cursor-switch sync-chats \
  --from-dir "$HOME/Library/Application Support/Cursor" \
  --to-dir "$HOME/Library/Application Support/Cursor-ProPlus" \
  --folder "$PWD" \
  --days 7 \
  --max-mb 80 \
  --dry-run
cursor-switch toggle
```

`--dry-run` prints the chat list and writes nothing. `sync-chats` refuses to use the default data dir as `--to-dir`.

## What this will not do

- Delete Super’s conversation list
- Copy other workspaces, or threads unused for more than 7 days
- Merge two diverged copies of the same thread
- Sync files in the project folder
- Let Grok and DeepSeek stay on at the same time (Cursor has no per-model base URL)

## Paths

| What | Where |
| --- | --- |
| Super chats and Super login | `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| Pro+ chats and Pro+ login | `~/Library/Application Support/Cursor-ProPlus/User/globalStorage/state.vscdb` |
| Captured logins, sync backups | `~/.config/cursor-switch/` |
| Pro+ extensions dir | `~/.cursor-proplus/extensions` |

## Prior art

Same public method as other switchers: swap `cursorAuth/%` in `state.vscdb`. This repo also opens a second `--user-data-dir`, copies one workspace’s recent threads into Pro+, and drives Cursor’s OpenAI-key toggle.

| Repo | Difference |
| --- | --- |
| [xorostar/multicursor](https://github.com/xorostar/multicursor) | Default data dir only |
| [keyBeatz/cursor-switch](https://github.com/keyBeatz/cursor-switch) | Linux |
| [reloadlife/cursor-account-switcher](https://github.com/reloadlife/cursor-account-switcher) | Does not import an already-signed-in second data dir |

## License

MIT
