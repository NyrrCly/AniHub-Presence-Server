import { app, Tray, Menu } from "electron";
import path from "path";
import { RPCServer } from "./services/rpcServer.js";

const rpcServer = new RPCServer();

app.whenReady().then(async () => {
  app.setLoginItemSettings({
    openAtLogin: true,
  });

  await rpcServer.start();

  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "logo.png")
    : path.join(import.meta.dirname, "assets/logo.png");

  const tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Очистити", click: () => rpcServer.clearActivity() },
    { label: "Перезавантажити", click: () => rpcServer.reloadActivity() },
    { type: "separator" },
    { label: "Зупинити", click: () => app.quit() },
  ]);

  tray.setToolTip("AniHub Presence");
  tray.setContextMenu(contextMenu);
});

app.on("window-all-closed", () => {
  rpcServer.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
