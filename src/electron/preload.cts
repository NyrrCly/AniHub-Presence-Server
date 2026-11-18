import { Event } from "electron/main";
import { PresenceData } from "../types/types";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("store", {
  getStoreValue: (key: string) => ipcRenderer.invoke("store:get", key),
  setStoreValue: (key: string, value: any) =>
    ipcRenderer.invoke("store:set", key, value),
});

contextBridge.exposeInMainWorld("electron", {
  onBeforeClose: (callback: () => void) => {
    ipcRenderer.on("request-width-on-close", () => {
      callback();
    });
  },
  ackClose: () => ipcRenderer.send("ack-close"),
  changePreviewInfo: (
    callback: (presenceData: PresenceData, dubbingStudioLogo: string) => void,
  ) => {
    ipcRenderer.on(
      "change-preview-info",
      (_event: Event, presenceData: PresenceData, dubbingStudioLogo: string) =>
        callback(presenceData, dubbingStudioLogo),
    );
  },
});

contextBridge.exposeInMainWorld("preference", {
  accountIcon: (enabled: boolean) =>
    ipcRenderer.send("preference:account-icon", enabled),
  dubbingIcon: (enabled: boolean) =>
    ipcRenderer.send("preference:dubbing-icon", enabled),
  anonymity: (enabled: boolean) =>
    ipcRenderer.send("preference:anonymity", enabled),
});

contextBridge.exposeInMainWorld("anihubLogin", {
  onAuthSuccess: (callback: (code: string) => void) => {
    ipcRenderer.on("anihub-auth-success", (_event: Event, code: string) =>
      callback(code),
    );
  },
});
