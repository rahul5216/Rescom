import { ITransport, PeerInfo } from './ITransport.js';
import { LanTransport } from './LanTransport.js';
import { SimulatedBleTransport } from './SimulatedBleTransport.js';
import { Packet, PacketType } from '../mesh/Packet.js';

export class TransportManager {
  private lanTransport: LanTransport;
  private bleTransport: SimulatedBleTransport;
  private packetHandlers: ((packet: Packet, transportType: string, fromPeerId?: string) => void)[] = [];

  constructor(lanTransport: LanTransport, bleTransport: SimulatedBleTransport) {
    this.lanTransport = lanTransport;
    this.bleTransport = bleTransport;

    this.lanTransport.onPacket((pkt, from) => this.dispatchPacket(pkt, 'LAN', from));
    this.bleTransport.onPacket((pkt, from) => this.dispatchPacket(pkt, 'BLE', from));
  }

  public getLanTransport(): LanTransport {
    return this.lanTransport;
  }

  public getBleTransport(): SimulatedBleTransport {
    return this.bleTransport;
  }

  public async discoverAllPeers(): Promise<PeerInfo[]> {
    const [lanPeers, blePeers] = await Promise.all([
      this.lanTransport.discover(),
      this.bleTransport.discover(),
    ]);

    const peerMap = new Map<string, PeerInfo>();

    for (const p of blePeers) {
      peerMap.set(p.peerId, p);
    }
    // LAN peers override BLE with better throughput
    for (const p of lanPeers) {
      peerMap.set(p.peerId, p);
    }

    return Array.from(peerMap.values());
  }

  /**
   * Route packet to appropriate transport based on size and type
   */
  public async sendPacket(packet: Packet, targetPeerId?: string): Promise<boolean> {
    const isControl = [
      PacketType.HELLO,
      PacketType.IDENTITY,
      PacketType.ROUTE_DISCOVERY,
      PacketType.ROUTE_UPDATE,
    ].includes(packet.type);

    if (isControl) {
      // Control messages can go over BLE or LAN
      await this.bleTransport.send(packet, targetPeerId);
    }

    // High throughput, data messages, and files use LAN
    return this.lanTransport.send(packet, targetPeerId);
  }

  public onPacket(handler: (packet: Packet, transportType: string, fromPeerId?: string) => void): void {
    this.packetHandlers.push(handler);
  }

  private dispatchPacket(packet: Packet, transportType: string, fromPeerId?: string): void {
    for (const handler of this.packetHandlers) {
      handler(packet, transportType, fromPeerId);
    }
  }
}
