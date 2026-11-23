# cursor-switch

macOS CLI that switches Cursor logins inside the **default** data directory so chat history stays put.

A switch quits Cursor and relaunches it. Unofficial; Cursor can change this storage in any release.

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

## Usage

```bash
chmod +x cursor-switch
mkdir -p ~/.local/bin
ln -sf "$(pwd)/cursor-switch" ~/.local/bin/cursor-switch

# Account currently signed in to the default window
cursor-switch capture super

# Account already signed in via --user-data-dir
cursor-switch capture proplus --from "$HOME/Library/Application Support/Cursor-ProPlus"

cursor-switch list
cursor-switch status

# Quit every Cursor process, write that login into the default dir, relaunch
cursor-switch to proplus
cursor-switch to super
```

`to` refreshes the saved session for whoever is currently in the default dir before swapping, so a just-rotated token is not lost.

## License

MIT
