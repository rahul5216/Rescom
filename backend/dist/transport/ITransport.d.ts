import { Packet } from '../mesh/Packet.js';
export interface PeerInfo {
    peerId: string;
    displayName: string;
    deviceId: string;
    publicKeyPem: string;
    connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'UNVERIFIED';
    preferredTransport: 'BLE' | 'WIFI_DIRECT' | 'LAN';
    address?: string;
    lastSeen: number;
    rssi?: number;
    hopCount?: number;
    relayPeerId?: string;
}
export interface ITransport {
    readonly transportType: 'BLE' | 'WIFI_DIRECT' | 'LAN';
    discover(): Promise<PeerInfo[]>;
    connect(peer: PeerInfo): Promise<boolean>;
    send(packet: Packet, targetAddress?: string): Promise<boolean>;
    disconnect(peerId?: string): Promise<void>;
    onPacket(handler: (packet: Packet, fromPeerId?: string) => void): void;
    onPeerDiscovered(handler: (peer: PeerInfo) => void): void;
}
