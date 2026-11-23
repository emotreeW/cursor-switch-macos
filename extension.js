const vscode = require("vscode");
const path = require("path");
const { spawn, execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

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

async function activate(context) {
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  item.command = "cursorSwitch.toggle";
  context.subscriptions.push(item);

  async function refresh() {
    try {
      const { stdout } = await runCli(context, ["status", "--json"]);
      const info = JSON.parse(stdout);
      const label = info.membership || info.name || "cursor";
      item.text = `$(account) ${label}`;
      item.tooltip = info.email
        ? `${info.email}  ·  click to switch`
        : "click to switch";
      item.show();
    } catch (err) {
      item.text = "$(account) cursor-switch";
      item.tooltip = String(err);
      item.show();
    }
  }

  async function switchAccount(args, label) {
    const choice = await vscode.window.showWarningMessage(
      `Quit Cursor and switch to ${label}? Unsaved files follow the normal quit prompt.`,
      { modal: true },
      "Switch"
    );
    if (choice !== "Switch") {
      return;
    }
    startSwitch(context, args);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("cursorSwitch.toggle", () =>
      switchAccount(["toggle"], "the other account")
    ),
    vscode.commands.registerCommand("cursorSwitch.to.super", () =>
      switchAccount(["to", "super"], "Super")
    ),
    vscode.commands.registerCommand("cursorSwitch.to.proplus", () =>
      switchAccount(["to", "proplus"], "Pro+")
    )
  );

  await refresh();
  const timer = setInterval(refresh, 30000);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
}

function deactivate() {}

module.exports = { activate, deactivate };
