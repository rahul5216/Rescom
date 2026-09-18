import { ITransport, PeerInfo } from './ITransport.js';
import { Packet } from '../mesh/Packet.js';
export declare class LanTransport implements ITransport {
    readonly transportType = "LAN";
    private packetHandlers;
    private peerDiscoveredHandlers;
    private sockets;
    private socketToPeerId;
    private wss;
    private localNodeId;
    constructor(localNodeId: string);
    /**
     * Attach an existing or new WebSocketServer to receive incoming connections from peers
     */
    attachServer(server: any): void;
    discover(): Promise<PeerInfo[]>;
    connect(peer: PeerInfo): Promise<boolean>;
    send(packet: Packet, targetPeerId?: string): Promise<boolean>;
    disconnect(peerId?: string): Promise<void>;
    onPacket(handler: (packet: Packet, fromPeerId?: string) => void): void;
    onPeerDiscovered(handler: (peer: PeerInfo) => void): void;
}
