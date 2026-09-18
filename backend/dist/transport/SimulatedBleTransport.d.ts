import { ITransport, PeerInfo } from './ITransport.js';
import { Packet } from '../mesh/Packet.js';
export declare class SimulatedBleTransport implements ITransport {
    readonly transportType = "BLE";
    private packetHandlers;
    private peerDiscoveredHandlers;
    private simulatedNearbyPeers;
    private scanInterval;
    constructor();
    private seedDefaultSimulatedPeers;
    discover(): Promise<PeerInfo[]>;
    addPeer(peer: PeerInfo): void;
    connect(peer: PeerInfo): Promise<boolean>;
    send(packet: Packet, targetAddress?: string): Promise<boolean>;
    disconnect(peerId?: string): Promise<void>;
    onPacket(handler: (packet: Packet, fromPeerId?: string) => void): void;
    onPeerDiscovered(handler: (peer: PeerInfo) => void): void;
    triggerIncomingPacket(packet: Packet, fromPeerId?: string): void;
}
