import { PeerInfo } from './ITransport.js';
import { LanTransport } from './LanTransport.js';
import { SimulatedBleTransport } from './SimulatedBleTransport.js';
import { Packet } from '../mesh/Packet.js';
export declare class TransportManager {
    private lanTransport;
    private bleTransport;
    private packetHandlers;
    constructor(lanTransport: LanTransport, bleTransport: SimulatedBleTransport);
    getLanTransport(): LanTransport;
    getBleTransport(): SimulatedBleTransport;
    discoverAllPeers(): Promise<PeerInfo[]>;
    /**
     * Route packet to appropriate transport based on size and type
     */
    sendPacket(packet: Packet, targetPeerId?: string): Promise<boolean>;
    onPacket(handler: (packet: Packet, transportType: string, fromPeerId?: string) => void): void;
    private dispatchPacket;
}
