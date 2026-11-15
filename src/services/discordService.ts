import RPC from "rpc-nyrrcly";
import { PresenceManager } from "../core/presenceManager.js";
import { BrowserWindow } from "electron";
import { startServer } from "../core/server.js";

export class RPCServer {
  public port: number;
  public clientId: string;
  public server: any;
  public win: BrowserWindow | null;
  public rpc: RPC.Client;
  public presenceManager: PresenceManager;

  constructor(port: number = 3000, win: BrowserWindow | null = null) {
    this.port = port;
    this.clientId = "1488575005175320858";
    this.server = null;
    this.win = win;
    this.rpc = new RPC.Client({ transport: "ipc" });
    this.presenceManager = new PresenceManager(this.rpc);
  }

  async connectRPC() {
    this.rpc.on("ready", () => {
      console.log("[Discord RPC] Successfully connected to discord!");
      this.presenceManager.setConnectionStatus(true);
    });

    this.rpc.on("disconnected", () => {
      this.presenceManager.setConnectionStatus(false);
      this.rpc.destroy();
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

  setAccountIcon(accountIcon: boolean = false) {
    this.presenceManager.setAccountIcon(accountIcon);
  }

  setDubbingIcon(dubbingIcon: boolean = false) {
    this.presenceManager.setDubbingIcon(dubbingIcon);
  }

  setAnonymity(anonymity: boolean = false) {
    this.presenceManager.setAnonymity(anonymity);
  }

  async start() {
    await this.connectRPC();

    this.server = startServer(this.win, this.presenceManager);

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
