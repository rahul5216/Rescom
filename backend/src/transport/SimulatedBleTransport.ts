import { ITransport, PeerInfo } from './ITransport.js';
import { Packet } from '../mesh/Packet.js';

export class SimulatedBleTransport implements ITransport {
  public readonly transportType = 'BLE';
  private packetHandlers: ((packet: Packet, fromPeerId?: string) => void)[] = [];
  private peerDiscoveredHandlers: ((peer: PeerInfo) => void)[] = [];
  private simulatedNearbyPeers: Map<string, PeerInfo> = new Map();
  private scanInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.seedDefaultSimulatedPeers();
  }

  private seedDefaultSimulatedPeers(): void {
    const campusPeers: PeerInfo[] = [
      {
        peerId: 'peer-rahul-01',
        displayName: 'Rahul Sharma (CS Lab)',
        deviceId: 'cg-node-a1b2c3d4e5f60001',
        publicKeyPem: '',
        connectionState: 'CONNECTED',
        preferredTransport: 'BLE',
        lastSeen: Date.now(),
        rssi: -58,
        hopCount: 1,
      },
      {
        peerId: 'peer-aman-02',
        displayName: 'Aman Verma (Library 2F)',
        deviceId: 'cg-node-b2c3d4e5f6a10002',
        publicKeyPem: '',
        connectionState: 'CONNECTED',
        preferredTransport: 'WIFI_DIRECT',
        lastSeen: Date.now() - 15000,
        rssi: -72,
        hopCount: 1,
      },
      {
        peerId: 'peer-priya-03',
        displayName: 'Priya Nair (Auditorium)',
        deviceId: 'cg-node-c3d4e5f6a1b20003',
        publicKeyPem: '',
        connectionState: 'CONNECTING',
        preferredTransport: 'BLE',
        lastSeen: Date.now() - 32000,
        rssi: -85,
        hopCount: 2,
        relayPeerId: 'peer-aman-02',
      },
      {
        peerId: 'peer-campus-admin-04',
        displayName: 'Rescom Relay Node #4',
        deviceId: 'cg-node-d4e5f6a1b2c30004',
        publicKeyPem: '',
        connectionState: 'CONNECTED',
        preferredTransport: 'LAN',
        lastSeen: Date.now(),
        rssi: -42,
        hopCount: 1,
      },
    ];

    for (const p of campusPeers) {
      this.simulatedNearbyPeers.set(p.peerId, p);
    }
  }

  public async discover(): Promise<PeerInfo[]> {
    // Return list with simulated fluctuating RSSI
    return Array.from(this.simulatedNearbyPeers.values()).map(p => ({
      ...p,
      rssi: (p.rssi || -60) + Math.floor(Math.random() * 5 - 2),
      lastSeen: Date.now(),
    }));
  }

  public addPeer(peer: PeerInfo): void {
    this.simulatedNearbyPeers.set(peer.peerId, peer);
    for (const h of this.peerDiscoveredHandlers) {
      h(peer);
    }
  }

  public async connect(peer: PeerInfo): Promise<boolean> {
    const existing = this.simulatedNearbyPeers.get(peer.peerId);
    if (existing) {
      existing.connectionState = 'CONNECTED';
      return true;
    }
    peer.connectionState = 'CONNECTED';
    this.simulatedNearbyPeers.set(peer.peerId, peer);
    return true;
  }

  public async send(packet: Packet, targetAddress?: string): Promise<boolean> {
    // BLE is best-effort simulation
    return true;
  }

  public async disconnect(peerId?: string): Promise<void> {
    if (peerId) {
      const p = this.simulatedNearbyPeers.get(peerId);
      if (p) p.connectionState = 'DISCONNECTED';
    }
  }

  public onPacket(handler: (packet: Packet, fromPeerId?: string) => void): void {
    this.packetHandlers.push(handler);
  }

  public onPeerDiscovered(handler: (peer: PeerInfo) => void): void {
    this.peerDiscoveredHandlers.push(handler);
  }

  public triggerIncomingPacket(packet: Packet, fromPeerId?: string): void {
    for (const h of this.packetHandlers) {
      h(packet, fromPeerId);
    }
  }
}
