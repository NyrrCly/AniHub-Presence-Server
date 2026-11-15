import { BrowserWindow } from "electron";
import http from "http";
import { PresenceData } from "../types/types.js";
import { PresenceManager } from "./presenceManager.js";

export function startServer(
  window: BrowserWindow | null = null,
  presenceManager: PresenceManager,
): http.Server {
  return http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      const authCode = new URL(
        req.url!,
        `http://${req.headers.host}`,
      ).searchParams.get("code");

      if (window) window.webContents.send("anihub-auth-success", authCode);
      res.end("<script>window.close()</script>");
      return;
    }

    if (req.method === "POST" && req.url === "/presence") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const data: PresenceData | null = body ? JSON.parse(body) : null;
          if (!data) {
            presenceManager.clearActivity();
          } else {
            presenceManager.setActivity(data);
          }
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
}
