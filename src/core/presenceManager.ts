import { Client } from "@nyrrcly/discord-rpc";
import store from "./configManager.js";
import { ActivityTimestamp, PresenceData } from "../types/types.js";
import { getDubbingStudioLogoUrl } from "../utils/dubbingStudios.js";
import { activityTime } from "../utils/timestamp.js";
import { BrowserWindow } from "electron";

export class PresenceManager {
  private rpc: Client;
  private win: BrowserWindow | null = null;
  private isConnected: boolean = false;
  private accountIcon: boolean = false;
  private dubbingIcon: boolean = false;
  private anonymity: boolean = false;
  private lastActivityData: PresenceData | null = null;

  constructor(rpcClient: Client, win: BrowserWindow | null) {
    this.rpc = rpcClient;
    this.win = win;
  }

  setConnectionStatus(connected: boolean) {
    this.isConnected = connected;
    if (connected && this.lastActivityData) {
      this.setActivity(this.lastActivityData);
    }
  }

  clearActivity() {
    if (!this.rpc || !this.isConnected) return;
    this.rpc.clearActivity();
  }

  reloadActivity() {
    if (!this.rpc || !this.isConnected) return;
    if (this.lastActivityData) {
      this.setActivity(this.lastActivityData);
    } else {
      this.clearActivity();
    }
  }

  setAccountIcon(accountIcon: boolean = false) {
    this.accountIcon = accountIcon;
    this.reloadActivity();
  }

  setDubbingIcon(dubbingIcon: boolean = false) {
    this.dubbingIcon = dubbingIcon;
    this.reloadActivity();
  }

  setAnonymity(anonymity: boolean = false) {
    this.anonymity = anonymity;
    if (anonymity) this.clearActivity();
    else this.reloadActivity();
  }

  setActivity(presenceData: PresenceData) {
    if (!this.rpc || !this.isConnected) return;
    this.lastActivityData = presenceData;
    if (this.anonymity) return;

    let { animeData, videoState, currentEpisode, dubbingStudio } = presenceData;

    const avatar = store.get("avatar");
    const username = store.get("username");

    currentEpisode = currentEpisode ?? "-";
    const totalEpisodes = animeData.episodes_count ?? "∞";

    let episodesText = `Епізоди: ${currentEpisode}/${totalEpisodes}`;
    let smallImage: string | undefined = undefined;
    let smallImageText: string | undefined = undefined;
    let smallImageUrl: string | undefined = undefined;

    let dubbingStudioLogo: string | undefined = undefined;

    if (this.dubbingIcon && dubbingStudio) {
      dubbingStudioLogo = getDubbingStudioLogoUrl(
        animeData.dubbing_studios,
        dubbingStudio,
      );
      smallImage = dubbingStudioLogo;
      smallImageText = dubbingStudio;
    } else if (this.accountIcon) {
      smallImage = avatar;
      smallImageText = username;
    }

    let timestamp: ActivityTimestamp | undefined;
    if (videoState) timestamp = activityTime(videoState);

    this.win?.webContents.send(
      "change-preview-info",
      presenceData,
      dubbingStudioLogo,
    );

    this.rpc
      .setActivity({
        type: 3, // Watching
        details: animeData.title_ukrainian,
        detailsUrl: `https://anihub.in.ua/anime/${animeData.slug}-${animeData.id}`,
        state: episodesText,
        stateUrl: `https://anihub.in.ua/anime/${animeData.slug}-${animeData.id}?episode=${currentEpisode}`,
        largeImageKey: animeData.poster_url || "logo",
        largeImageText: animeData.title_ukrainian || "Anime Poster",
        smallImageKey: smallImage,
        smallImageText: smallImageText,
        smallImageUrl: smallImageUrl,
        startTimestamp: timestamp?.startTimestamp || 0,
        endTimestamp: timestamp?.endTimestamp || 0,
        buttons: [
          {
            label: "Anime Link",
            url: `https://anihub.in.ua/anime/${animeData.slug}-${animeData.id}`,
          },
        ],
      })
      .catch(console.error);
  }
}
