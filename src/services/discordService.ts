import { Client } from "@nyrrcly/discord-rpc";
import { PresenceManager } from "../core/presenceManager.js";
import { BrowserWindow } from "electron";
import { startServer } from "../core/server.js";

export class RPCServer {
  private port: number;
  private clientId: string;
  private server: any;
  private win: BrowserWindow | null;
  private rpc: Client | null = null;
  private isConnecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  public presenceManager: PresenceManager;

  constructor(port: number = 3000, win: BrowserWindow | null = null) {
    this.port = port;
    this.clientId = "1488575005175320858";
    this.server = null;
    this.win = win;
    this.presenceManager = new PresenceManager(null, this.win);
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

  async connectRPC() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.createClient();
      await this.rpc!.login({ clientId: this.clientId });
    } catch (error: any) {
      console.error("[Discord RPC] Connection error:", error.message);
      this.isConnecting = false;
      this.presenceManager.setConnectionStatus(false);
      this.reconnect();
    }
  }

  private createClient() {
    if (this.rpc) {
      this.rpc.removeAllListeners();
      this.rpc.destroy().catch(() => {});
    }

    this.rpc = new Client({ transport: "ipc" });

    this.rpc.on("ready", () => {
      this.isConnecting = false;
      console.log("[Discord RPC] Successfully connected to discord!");
      this.presenceManager.setClient(this.rpc!);
      this.presenceManager.setConnectionStatus(true);
    });

    this.rpc.on("disconnected", () => {
      this.isConnecting = false;
      console.log("[Discord RPC] Disconnected!");
      this.presenceManager.setConnectionStatus(false);
      this.reconnect();
    });
  }

  private reconnect() {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectRPC();
    }, 1000);
  }
}
