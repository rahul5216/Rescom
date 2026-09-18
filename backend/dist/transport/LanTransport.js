"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanTransport = void 0;
const ws_1 = require("ws");
class LanTransport {
    transportType = 'LAN';
    packetHandlers = [];
    peerDiscoveredHandlers = [];
    // peerId or address -> WebSocket
    sockets = new Map();
    // Socket -> peerId
    socketToPeerId = new Map();
    wss = null;
    localNodeId;
    constructor(localNodeId) {
        this.localNodeId = localNodeId;
    }
    /**
     * Attach an existing or new WebSocketServer to receive incoming connections from peers
     */
    attachServer(server) {
        this.wss = new ws_1.WebSocketServer({ server, path: '/mesh-lan' });
        this.wss.on('connection', (ws, req) => {
            const remoteAddress = req.socket.remoteAddress || 'unknown';
            ws.on('message', (data) => {
                try {
                    const packet = JSON.parse(data.toString());
                    const fromPeerId = packet.sourceId;
                    if (fromPeerId) {
                        this.sockets.set(fromPeerId, ws);
                        this.socketToPeerId.set(ws, fromPeerId);
                    }
                    // Emit to handlers
                    for (const handler of this.packetHandlers) {
                        handler(packet, fromPeerId);
                    }
                }
                catch (err) {
                    console.error('[LanTransport] Failed to parse incoming packet:', err);
                }
            });
            ws.on('close', () => {
                const peerId = this.socketToPeerId.get(ws);
                if (peerId) {
                    this.sockets.delete(peerId);
                    this.socketToPeerId.delete(ws);
                }
            });
        });
    }
    async discover() {
        // In LAN transport, discover returns currently connected peers
        const peers = [];
        for (const [peerId, ws] of this.sockets.entries()) {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                peers.push({
                    peerId,
                    displayName: `Peer-${peerId.substring(0, 8)}`,
                    deviceId: peerId,
                    publicKeyPem: '',
                    connectionState: 'CONNECTED',
                    preferredTransport: 'LAN',
                    lastSeen: Date.now(),
                    rssi: -45,
                    hopCount: 1,
                });
            }
        }
        return peers;
    }
    async connect(peer) {
        if (!peer.address)
            return false;
        const address = peer.address;
        return new Promise((resolve) => {
            try {
                const ws = new ws_1.WebSocket(address);
                ws.on('open', () => {
                    this.sockets.set(peer.peerId, ws);
                    this.socketToPeerId.set(ws, peer.peerId);
                    resolve(true);
                });
                ws.on('message', (data) => {
                    try {
                        const packet = JSON.parse(data.toString());
                        for (const handler of this.packetHandlers) {
                            handler(packet, peer.peerId);
                        }
                    }
                    catch (err) {
                        console.error('[LanTransport] Parse error:', err);
                    }
                });
                ws.on('error', (err) => {
                    resolve(false);
                });
                ws.on('close', () => {
                    this.sockets.delete(peer.peerId);
                    this.socketToPeerId.delete(ws);
                });
            }
            catch {
                resolve(false);
            }
        });
    }
    async send(packet, targetPeerId) {
        const raw = JSON.stringify(packet);
        if (targetPeerId) {
            const ws = this.sockets.get(targetPeerId);
            if (ws && ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(raw);
                return true;
            }
        }
        // If no target specified or broadcasting, broadcast to all connected peer sockets
        let sentCount = 0;
        for (const ws of this.sockets.values()) {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(raw);
                sentCount++;
            }
        }
        return sentCount > 0;
    }
    async disconnect(peerId) {
        if (peerId) {
            const ws = this.sockets.get(peerId);
            if (ws) {
                ws.close();
                this.sockets.delete(peerId);
            }
        }
        else {
            for (const ws of this.sockets.values()) {
                ws.close();
            }
            this.sockets.clear();
            this.socketToPeerId.clear();
        }
    }
    onPacket(handler) {
        this.packetHandlers.push(handler);
    }
    onPeerDiscovered(handler) {
        this.peerDiscoveredHandlers.push(handler);
    }
}
exports.LanTransport = LanTransport;
