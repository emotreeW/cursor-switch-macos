const vscode = require("vscode");
const path = require("path");
const { spawn, execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const PERSIST_KEY =
  "src.vs.platform.reactivestorage.browser.reactiveStorageServiceImpl.persistentStorage.applicationUser";
const TOGGLE_OPENAI_KEY = "aiSettings.usingOpenAIKey.toggle";
const DEEPSEEK_MODEL = "deepseek-flash";

function cliPath(context) {
  return path.join(context.extensionPath, "cursor-switch");
}

function runCli(context, args) {
  return execFileAsync(cliPath(context), args, { timeout: 15000 });
}

function startSwitch(context, args) {
  const child = spawn(cliPath(context), args, {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  child.unref();
}

function dataDirFromExtension(context) {
  return path.resolve(context.globalStorageUri.fsPath, "..", "..", "..");
}

function otherDataDir(fromDir) {
  const home = process.env.HOME || "";
  const proplus = path.join(home, "Library/Application Support/Cursor-ProPlus");
  const def = path.join(home, "Library/Application Support/Cursor");
  if (path.resolve(fromDir) === path.resolve(proplus)) {
    return def;
  }
  return proplus;
}

function stateDbPath(context) {
  return path.join(context.globalStorageUri.fsPath, "..", "state.vscdb");
}

function addedModelNames(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return entry;
    }
    if (entry && typeof entry === "object") {
      return entry.id || entry.name || entry.modelId || "";
    }
    return "";
  });
}

async function readByok(dbPath) {
  const { stdout } = await execFileAsync(
    "/usr/bin/sqlite3",
    ["-readonly", dbPath, `SELECT value FROM ItemTable WHERE key = '${PERSIST_KEY}'`],
    { timeout: 8000, maxBuffer: 8 * 1024 * 1024 }
  );
  const data = JSON.parse(stdout);
  const ai = data.aiSettings || {};
  return {
    on: Boolean(data.useOpenAIKey),
    baseUrl: String(data.openAIBaseUrl || ""),
    added: addedModelNames(ai.userAddedModels),
  };
}

async function activate(context) {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  item.command = "cursorSwitch.menu";
  context.subscriptions.push(item);

  const byokItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    101
  );
  byokItem.command = "cursorSwitch.toggleDeepSeek";
  context.subscriptions.push(byokItem);

  const dbPath = stateDbPath(context);

  async function refresh() {
    try {
      const { stdout } = await runCli(context, ["status", "--json"]);
      const info = JSON.parse(stdout);
      const label = info.membership || info.name || "cursor";
      item.text = `$(account) ${label}`;
      item.tooltip = info.email
        ? `${info.email}  ·  open other window, sync chats, or switch login`
        : "open other window, sync chats, or switch login";
      item.show();
    } catch (err) {
      item.text = "$(account) cursor-switch";
      item.tooltip = String(err);
      item.show();
    }
  }

  async function switchAccount(args, label) {
    const choice = await vscode.window.showWarningMessage(
      `Quit this Cursor and switch the default login to ${label}? Unsaved files follow the normal quit prompt. To keep this window and open the other account, pick Open other window.`,
      { modal: true },
      "Switch"
    );
    if (choice !== "Switch") {
      return;
    }
    startSwitch(context, args);
  }

  async function openOther() {
    const fromDir = dataDirFromExtension(context);
    const folders = vscode.workspace.workspaceFolders;
    const args = ["open-other", "--from-dir", fromDir];
    if (folders && folders.length) {
      args.push("--folder", folders[0].uri.fsPath);
    }
    const { stdout } = await execFileAsync(cliPath(context), args, {
      timeout: 20000,
    });
    const info = JSON.parse(String(stdout || "{}"));
    vscode.window.showInformationMessage(
      info.action === "focus"
        ? `Brought the other Cursor (${info.kind}) to the front.`
        : `Opened the other Cursor (${info.kind}).`
    );
  }

  async function showMenu() {
    const picked = await vscode.window.showQuickPick(
      [
        {
          label: "$(window) Open other window",
          description: "Keep this window. Focus or launch the other account.",
          id: "open",
        },
        {
          label: "$(sync) Sync chats",
          description: "Copy this workspace's recent threads into the other account.",
          id: "sync",
        },
        {
          label: "$(account) Switch login",
          description: "Quit this window and swap the default Cursor login.",
          id: "switch",
        },
      ],
      { placeHolder: "This window stays open unless you switch login" }
    );
    if (!picked) {
      return;
    }
    if (picked.id === "open") {
      await openOther();
      return;
    }
    if (picked.id === "sync") {
      await vscode.commands.executeCommand("cursorSwitch.syncChats");
      return;
    }
    await switchAccount(["toggle"], "the other account");
  }

  async function refreshByok() {
    try {
      const byok = await readByok(dbPath);
      if (byok.on) {
        byokItem.text = "$(cloud) DeepSeek";
        byokItem.tooltip =
          "OpenAI key override is ON. Click to restore Cursor Grok. Does not open a new chat.";
      } else {
        byokItem.text = "$(zap) Grok";
        byokItem.tooltip =
          "OpenAI key override is OFF. Click to send chat through your DeepSeek API. Does not open a new chat.";
      }
      byokItem.show();
      return byok;
    } catch (err) {
      byokItem.text = "$(cloud) DeepSeek?";
      byokItem.tooltip = String(err);
      byokItem.show();
      return null;
    }
  }

  async function toggleDeepSeek() {
    const before = await refreshByok();
    try {
      await vscode.commands.executeCommand(TOGGLE_OPENAI_KEY);
    } catch (err) {
      vscode.window.showErrorMessage(
        `Could not run ${TOGGLE_OPENAI_KEY}: ${err}`
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    const after = await refreshByok();
    const on = after ? after.on : before ? !before.on : false;
    if (on) {
      const hasFlash =
        after && after.added.some((name) => name === DEEPSEEK_MODEL);
      const missing = hasFlash
        ? ""
        : ` Add custom model ${DEEPSEEK_MODEL} under Settings > Models if it is not in the picker.`;
      vscode.window.showInformationMessage(
        `DeepSeek override is ON. Pick ${DEEPSEEK_MODEL} in the current chat.${missing}`
      );
    } else {
      vscode.window.showInformationMessage(
        "DeepSeek override is OFF. Pick Grok in the current chat."
      );
    }
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorSwitch.menu", () => showMenu()),
    vscode.commands.registerCommand("cursorSwitch.openOther", () => openOther()),
    vscode.commands.registerCommand("cursorSwitch.toggle", () =>
      switchAccount(["toggle"], "the other account")
    ),
    vscode.commands.registerCommand("cursorSwitch.to.super", () =>
      switchAccount(["to", "super"], "Super")
    ),
    vscode.commands.registerCommand("cursorSwitch.to.proplus", () =>
      switchAccount(["to", "proplus"], "Pro+")
    ),
    vscode.commands.registerCommand(
      "cursorSwitch.toggleDeepSeek",
      toggleDeepSeek
    ),
    vscode.commands.registerCommand("cursorSwitch.syncChats", async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || !folders.length) {
        vscode.window.showErrorMessage("Open a folder first.");
        return;
      }
      const fromDir = dataDirFromExtension(context);
      const toDir = otherDataDir(fromDir);
      const folder = folders[0].uri.fsPath;
      const choice = await vscode.window.showWarningMessage(
        `Copy every chat in this workspace that was used in the last 7 days (the full thread, not just the last week's messages), then quit and reopen the other window? This window stays open. Destination chats that are newer are left alone.`,
        { modal: true },
        "Sync"
      );
      if (choice !== "Sync") {
        return;
      }
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Syncing chats to the other Cursor",
        },
        async () => {
          const { stdout } = await execFileAsync(
            cliPath(context),
            [
              "sync-chats",
              "--from-dir",
              fromDir,
              "--to-dir",
              toDir,
              "--folder",
              folder,
              "--days",
              "7",
              "--max-mb",
              "80",
            ],
            { timeout: 180000, maxBuffer: 8 * 1024 * 1024 }
          );
          const line = String(stdout || "").trim().split("\n").pop() || "";
          const info = JSON.parse(line);
          vscode.window.showInformationMessage(
            `Copied ${info.copy} chats (${Math.round((info.bytes || 0) / 1048576)} MB, ${info.days} days). Skipped ${(info.skipNewerOnDest || []).length} newer on the other side.`
          );
        }
      );
    })
  );

  await refresh();
  await refreshByok();
  const timer = setInterval(refresh, 30000);
  const byokTimer = setInterval(refreshByok, 5000);
  context.subscriptions.push({
    dispose: () => {
      clearInterval(timer);
      clearInterval(byokTimer);
    },
  });
}

function deactivate() {}

module.exports = { activate, deactivate };
