import { WebSocket, WebSocketServer } from 'ws';
import { ITransport, PeerInfo } from './ITransport.js';
import { Packet } from '../mesh/Packet.js';

export class LanTransport implements ITransport {
  public readonly transportType = 'LAN';
  private packetHandlers: ((packet: Packet, fromPeerId?: string) => void)[] = [];
  private peerDiscoveredHandlers: ((peer: PeerInfo) => void)[] = [];

  // peerId or address -> WebSocket
  private sockets: Map<string, WebSocket> = new Map();
  // Socket -> peerId
  private socketToPeerId: Map<WebSocket, string> = new Map();

  private wss: WebSocketServer | null = null;
  private localNodeId: string;

  constructor(localNodeId: string) {
    this.localNodeId = localNodeId;
  }

  /**
   * Attach an existing or new WebSocketServer to receive incoming connections from peers
   */
  public attachServer(server: any): void {
    this.wss = new WebSocketServer({ server, path: '/mesh-lan' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const remoteAddress = req.socket.remoteAddress || 'unknown';

      ws.on('message', (data: any) => {
        try {
          const packet: Packet = JSON.parse(data.toString());
          const fromPeerId = packet.sourceId;

          if (fromPeerId) {
            this.sockets.set(fromPeerId, ws);
            this.socketToPeerId.set(ws, fromPeerId);
          }

          // Emit to handlers
          for (const handler of this.packetHandlers) {
            handler(packet, fromPeerId);
          }
        } catch (err) {
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

  public async discover(): Promise<PeerInfo[]> {
    // In LAN transport, discover returns currently connected peers
    const peers: PeerInfo[] = [];
    for (const [peerId, ws] of this.sockets.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
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

  public async connect(peer: PeerInfo): Promise<boolean> {
    if (!peer.address) return false;
    const address = peer.address;

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(address);

        ws.on('open', () => {
          this.sockets.set(peer.peerId, ws);
          this.socketToPeerId.set(ws, peer.peerId);
          resolve(true);
        });

        ws.on('message', (data: any) => {
          try {
            const packet: Packet = JSON.parse(data.toString());
            for (const handler of this.packetHandlers) {
              handler(packet, peer.peerId);
            }
          } catch (err) {
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
      } catch {
        resolve(false);
      }
    });
  }

  public async send(packet: Packet, targetPeerId?: string): Promise<boolean> {
    const raw = JSON.stringify(packet);

    if (targetPeerId) {
      const ws = this.sockets.get(targetPeerId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
        return true;
      }
    }

    // If no target specified or broadcasting, broadcast to all connected peer sockets
    let sentCount = 0;
    for (const ws of this.sockets.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
        sentCount++;
      }
    }

    return sentCount > 0;
  }

  public async disconnect(peerId?: string): Promise<void> {
    if (peerId) {
      const ws = this.sockets.get(peerId);
      if (ws) {
        ws.close();
        this.sockets.delete(peerId);
      }
    } else {
      for (const ws of this.sockets.values()) {
        ws.close();
      }
      this.sockets.clear();
      this.socketToPeerId.clear();
    }
  }

  public onPacket(handler: (packet: Packet, fromPeerId?: string) => void): void {
    this.packetHandlers.push(handler);
  }

  public onPeerDiscovered(handler: (peer: PeerInfo) => void): void {
    this.peerDiscoveredHandlers.push(handler);
  }
}
