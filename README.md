# cursor-switch

macOS CLI：在 **同一份** Cursor 数据目录里换登录，对话列表不动。

换号会退出并重新打开 Cursor。两边窗口一直开着、发一条对面马上看见，做不到。

非官方。Cursor 改存储格式后这个工具会失效。Cursor 员工说过：多个自己的账号可以，把同一个账号借给别人用不行。

## GitHub 上已经有的

| 仓库 | 做什么 | 缺口 |
| --- | --- | --- |
| [xorostar/multicursor](https://github.com/xorostar/multicursor) | Mac 菜单栏，写 `cursorAuth/*` + Keychain，再重启 Cursor | 只从当前默认目录抓登录，不能从第二个 `--user-data-dir` 导入 |
| [keyBeatz/cursor-switch](https://github.com/keyBeatz/cursor-switch) | 同样只换 token、对话共用 | 只支持 Linux |
| [reloadlife/cursor-account-switcher](https://github.com/reloadlife/cursor-account-switcher) | 多工具 CLI（Cursor / Claude / Codex） | 不处理「第二个 user-data-dir 已经登好」这种情况 |

本工具按他们公开的做法写：只改默认目录 `state.vscdb` 里的 `cursorAuth/%` 和 `glass.lastSignedInAuthId`。另外可以从 `~/Library/Application Support/Cursor-ProPlus` 这种第二份目录把已经登好的号抓进来。不把 31GB 的对话库拷来拷去。

## 本机路径

- 对话和当前登录：`~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- 抓下来的登录（本机，不进 git）：`~/.config/cursor-switch/accounts/`
- 第二份窗口（如果用过 `--user-data-dir`）：`~/Library/Application Support/Cursor-ProPlus`

## 用法

```bash
chmod +x cursor-switch
mkdir -p ~/.local/bin
ln -sf "$(pwd)/cursor-switch" ~/.local/bin/cursor-switch

# 当前默认窗口里的号
cursor-switch capture super

# 已经用 --user-data-dir 登好的 Pro+
cursor-switch capture proplus --from "$HOME/Library/Application Support/Cursor-ProPlus"

cursor-switch list
cursor-switch status

# 换到 Pro+：退出所有 Cursor，把 Pro+ 的登录写进默认目录，再打开
cursor-switch to proplus
cursor-switch to super
```

`to` 会先把默认目录里正在用的登录写回对应的保存文件，避免刚刷新过的 token 丢掉。

## 不做的事

- 不把两个正在运行的 Cursor 接到同一份 SQLite（会写坏）
- 不备份整份 `state.vscdb`（可以到几十 GB）
- 不动 Keychain 里的 `Cursor Safe Storage`（那是 Electron 的加密钥，不是登录 JWT）
- 不把 token 写进这个 git 仓库

## License

MIT
