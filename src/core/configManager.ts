import ElectronStore from "electron-store";
import { UserConfig } from "../types/types.js";

const store = new ElectronStore<UserConfig>({
  defaults: {
    port: 3000,
    anonymity: false,
    accountIcon: false,
    dubbingIcon: false,
    settingsWidth: 450,
    idToken: undefined,
    accessToken: undefined,
    refreshToken: undefined,
    username: undefined,
    avatar: undefined,
  },
});

export default store;
