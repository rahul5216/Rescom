import { Packet } from './Packet.js';
import { DuplicateDetector } from './DuplicateDetector.js';
import { RoutingTable } from './RoutingTable.js';
export interface RouteResult {
    status: 'DELIVER_LOCAL' | 'FORWARD' | 'BROADCAST' | 'DROPPED_DUPLICATE' | 'DROPPED_TTL' | 'DROPPED_NO_ROUTE';
    targetHopId?: string;
    forwardedPacket?: Packet;
}
export declare class MeshRouter {
    private localNodeId;
    private duplicateDetector;
    private routingTable;
    constructor(localNodeId: string, duplicateDetector?: DuplicateDetector, routingTable?: RoutingTable);
    getRoutingTable(): RoutingTable;
    getDuplicateDetector(): DuplicateDetector;
    /**
     * Process an incoming packet and determine forwarding or local delivery
     */
    routePacket(packet: Packet, incomingFromPeerId?: string): RouteResult;
    learnRoute(sourceId: string, viaPeerId: string, hopsFromSource: number, transport?: string): void;
}
