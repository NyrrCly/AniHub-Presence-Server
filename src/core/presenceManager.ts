import RPC from "rpc-nyrrcly";
import store from "./configManager.js";
import { ActivityTimestamp, PresenceData } from "../types/types.js";
import { getDubbingStudioLogoUrl } from "../utils/dubbingStudios.js";
import { activityTime } from "../utils/timestamp.js";

export class PresenceManager {
  private rpc: RPC.Client;
  private isConnected: boolean = false;
  private accountIcon: boolean = false;
  private dubbingIcon: boolean = false;
  private anonymity: boolean = false;
  private lastActivityData: PresenceData | null = null;

  constructor(rpcClient: any) {
    this.rpc = rpcClient;
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

  setAccountIcon(accountIcon: boolean) {
    this.accountIcon = accountIcon;
    this.reloadActivity();
  }

  setDubbingIcon(dubbingIcon: boolean) {
    this.dubbingIcon = dubbingIcon;
    this.reloadActivity();
  }

  setAnonymity(anonymity: boolean) {
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

    if (this.dubbingIcon && dubbingStudio) {
      smallImage = getDubbingStudioLogoUrl(
        animeData.dubbing_studios,
        dubbingStudio,
      );
      smallImageText = dubbingStudio;
    } else if (this.accountIcon) {
      smallImage = avatar;
      smallImageText = username;
      smallImageUrl = `https://anihub.in.ua/profile/${username}`;
    }

    let timestamp: ActivityTimestamp | undefined;
    if (videoState) timestamp = activityTime(videoState);

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
