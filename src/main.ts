import { app, Tray, Menu, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { RPCServer } from "./services/discordService.js";
import store from "./core/configManager.js";
import { UserConfig } from "./types/types.js";

const electronConfig: UserConfig = {
  anonymity: store.get("anonymity", false),
  accountIcon: store.get("accountIcon", false),
  dubbingIcon: store.get("dubbingIcon", false),
  port: store.get("port", 3000),
};
let isQuitting = false;

let win: BrowserWindow;
let rpcServer: RPCServer;
function createWindow(iconPath: string) {
  win = new BrowserWindow({
    height: 700,
    width: 1200,
    minHeight: 550,
    minWidth: 1000,
    center: true,
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(import.meta.dirname, "electron", "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false,
    },
  });

  win.maximize();

  win.loadFile(
    path.join(import.meta.dirname, "electron/renderer", "index.html"),
  );
}

app.whenReady().then(async () => {
  app.setLoginItemSettings({
    openAtLogin: true,
  });

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "logo.png")
    : path.join(import.meta.dirname, "assets/logo.png");

  createWindow(iconPath);

  rpcServer = new RPCServer(electronConfig.port, win);
  rpcServer.presenceManager.setDubbingIcon(electronConfig.dubbingIcon);
  rpcServer.presenceManager.setAccountIcon(electronConfig.accountIcon);

  if (!electronConfig.anonymity) await rpcServer.start();

  const tray = new Tray(iconPath);

  tray.setToolTip("AniHub Presence");
  tray.on("click", () => {
    win.show();
    win.focus();
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Очистити",
      click: () => rpcServer.presenceManager.clearActivity(),
    },
    {
      label: "Перезавантажити",
      click: () => rpcServer.presenceManager.reloadActivity(),
    },
    { type: "separator" },
    {
      label: "Зупинити",
      click: () => {
        isQuitting = true;
        win.webContents.send("request-width-on-close");
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("anihub.in.ua")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url.includes("anihub.in.ua")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    win.hide();
  });
});

ipcMain.on("ack-close", () => {
  if (isQuitting) app.quit();
  else win.hide();
});

ipcMain.on("preference:account-icon", (_, enabled: boolean) => {
  rpcServer.presenceManager.setAccountIcon(enabled);
});
ipcMain.on("preference:dubbing-icon", (_, enabled: boolean) => {
  rpcServer.presenceManager.setDubbingIcon(enabled);
});
ipcMain.on("preference:anonymity", (_, enabled: boolean) => {
  rpcServer.presenceManager.setAnonymity(enabled);
});
ipcMain.handle("store:get", (_, key) => store.get(key));
ipcMain.handle("store:set", (_, key, value) => {
  if (value === undefined || value === null) store.delete(key);
  else store.set(key, value);
});
