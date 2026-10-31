import RPC from "rpc-nyrrcly";
import http from "http";
import { PresenceData } from "../types/types.js";
import { getDubbingStudioLogoUrl } from "../utils/dubbingStudios.js";

export class RPCServer {
  public port: number;
  public clientId: string;
  public server: any;
  public rpc: any;
  public isConnected: boolean;
  public isCleared: boolean;
  public smallDubbingIcon: boolean;
  public lastActivityData: PresenceData | null = null;

  constructor(port: number = 3000, clientId: string = "1488575005175320858") {
    this.port = port;
    this.clientId = clientId;
    this.server = null;
    this.rpc = null;
    this.isConnected = false;
    this.smallDubbingIcon = false;
    this.isCleared = true;
  }

  async connectRPC() {
    this.rpc = new RPC.Client({ transport: "ipc" });

    this.rpc.on("ready", () => {
      console.log("[Discord RPC] Successfully connected to discord!");
      this.isConnected = true;
    });

    this.rpc.on("disconnected", () => {
      this.rpc.destroy();
      this.isConnected = false;
      setTimeout(() => {
        this.connectRPC();
      }, 5000);
    });

    try {
      await this.rpc.login({ clientId: this.clientId });
    } catch (error: any) {
      console.error("[Discord RPC] Connection error:", error.message);
      setTimeout(() => {
        this.connectRPC();
      }, 5000);
    }
  }

  clearActivity() {
    if (!this.rpc || !this.isConnected || this.isCleared) return;
    this.isCleared = true;
    this.rpc.clearActivity();
  }

  reloadActivity() {
    if (!this.rpc || !this.isConnected) return;
    if (this.lastActivityData) {
      this.setActivity(this.lastActivityData);
    } else this.clearActivity();
  }

  setSmallDubbingIcon(smallDubbingIcon: boolean) {
    if (!this.rpc || !this.isConnected) return;
    this.smallDubbingIcon = smallDubbingIcon;
    this.reloadActivity();
  }

  setActivity(presenceData: PresenceData) {
    if (!this.rpc || !this.isConnected) return;
    this.isCleared = false;

    const { animeData, userData, videoState, currentEpisode, dubbingStudio } = presenceData;    
    const now = Date.now();

    let startTimestamp: number | undefined;
    let endTimestamp: number | undefined;
    if (videoState) {
      startTimestamp = Math.floor(
        now - videoState.currentTime * 1000,
      );
      endTimestamp = Math.floor(
        startTimestamp + videoState.duration * 1000,
      );
    }

    const episodesText = `Епізоди: ${currentEpisode}/${animeData.episodes_count ?? "∞"}`;
    const studioText = ` • ${dubbingStudio}`;
    const state = this.smallDubbingIcon ? episodesText : `${episodesText}${studioText}`;

    const smallImageKey = this.smallDubbingIcon
      ? getDubbingStudioLogoUrl(animeData.dubbing_studios, dubbingStudio)
      : userData?.avatar;
    const smallImageText = this.smallDubbingIcon
      ? `Дубляж: ${dubbingStudio}`
      : userData?.username;

    const fallbackLogo = "logo";
    const fallbackText = "N/A";
    const animeTitle = animeData.title_ukrainian || "Дивиться аніме";

    this.rpc
      .setActivity({
        details: animeTitle,
        state: state,
        type: 3, // Watching
        largeImageKey: animeData.poster_url || fallbackLogo,
        largeImageText: animeData.title_ukrainian || fallbackText,
        largeImageUrl: "",
        smallImageKey: smallImageKey || fallbackLogo,
        smallImageText: smallImageText || fallbackText,
        smallImageUrl: "",
        startTimestamp: startTimestamp || 0,
        endTimestamp: endTimestamp || 0,
        buttons: [
          {
            label: "My Profile",
            url: `https://anihub.in.ua/profile/${userData.username}`,
          },
          {
            label: "Anime Link",
            url: `https://anihub.in.ua/anime/${animeData.slug}-${animeData.id}`,
          },
        ],
      })
      .catch(console.error);
  }

  async start() {
    await this.connectRPC();

    this.server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }

      if (req.method === "POST" && req.url === "/presence") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            this.lastActivityData = data ? data : null;
            if (!data) this.clearActivity();
            else this.setActivity(data);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "successful" }));
          } catch (err) {
            res.writeHead(400).end();
          }
        });
      } else {
        res.writeHead(404).end();
      }
    });

    this.server.listen(this.port, () => {
      console.log(`[HTTP Server] Працює на http://localhost:${this.port}`);
    });
  }

  stop() {
    if (this.server) this.server.close();
    if (this.rpc) this.rpc.destroy();
    console.log("[Discord RPC] Сервер зупинено.");
  }
}
