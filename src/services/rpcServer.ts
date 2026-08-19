import RPC from "rpc-nyrrcly";
import http from "http";
import {ActivityData} from "../types/types.js";

export class RPCServer {
    public port: number;
    public clientId: string;
    public server: any;
    public rpc: any;
    public isConnected: boolean;

    constructor(port: number = 3000, clientId: string = '1488575005175320858') {
        this.port = port;
        this.clientId = clientId;
        this.server = null;
        this.rpc = null;
        this.isConnected = false;
    }

    async connectRPC() {
        this.rpc = new RPC.Client({transport: 'ipc'});

        this.rpc.on('ready', () => {
            console.log('[Discord RPC] Successfully connected to discord!');
            this.isConnected = true;
        })

        try {
            await this.rpc.login({ clientId: this.clientId });
        } catch (error: any) {
            console.error('[Discord RPC] Connection error:', error.message);
        }
    }

    setActivity(activityData: ActivityData) {
        if (!this.rpc || !this.isConnected) return;
        this.rpc.setActivity({
            details: activityData.details || 'Дивиться аніме',
            state: activityData.state || 'Відкрито AnihubStatus',
            type: activityData.type || 3,
            largeImageKey: activityData.largeImageKey || 'logo',
            largeImageText: activityData.largeImageText || 'Logo',
            largeImageUrl: activityData.largeImageUrl || '',
            smallImageKey: activityData.smallImageKey || '',
            smallImageText: activityData.smallImageText || '',
            smallImageUrl: activityData.smallImageUrl || '',
            partyId: activityData.partyId || '',
            partySize: activityData.partySize || 0,
            partyMax: activityData.partyMax || 0,
            startTimestamp: activityData.startTimestamp || 0,
            endTimestamp: activityData.endTimestamp || 0,
            buttons: activityData.buttons || {}
        }).catch(console.error);
    }

    async start() {
        await this.connectRPC();

        this.server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                return res.end();
            }

            if (req.method === 'POST' && req.url === '/presence') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        this.setActivity(JSON.parse(body));

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'successful' }));
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
        console.log('[Discord RPC] Сервер зупинено.');
    }
}