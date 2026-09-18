import { Packet, PacketType } from './Packet.js';
import { DuplicateDetector } from './DuplicateDetector.js';
import { RoutingTable } from './RoutingTable.js';

export interface RouteResult {
  status: 'DELIVER_LOCAL' | 'FORWARD' | 'BROADCAST' | 'DROPPED_DUPLICATE' | 'DROPPED_TTL' | 'DROPPED_NO_ROUTE';
  targetHopId?: string;
  forwardedPacket?: Packet;
}

export class MeshRouter {
  private localNodeId: string;
  private duplicateDetector: DuplicateDetector;
  private routingTable: RoutingTable;

  constructor(localNodeId: string, duplicateDetector?: DuplicateDetector, routingTable?: RoutingTable) {
    this.localNodeId = localNodeId;
    this.duplicateDetector = duplicateDetector || new DuplicateDetector();
    this.routingTable = routingTable || new RoutingTable();
  }

  public getRoutingTable(): RoutingTable {
    return this.routingTable;
  }

  public getDuplicateDetector(): DuplicateDetector {
    return this.duplicateDetector;
  }

  /**
   * Process an incoming packet and determine forwarding or local delivery
   */
  public routePacket(packet: Packet, incomingFromPeerId?: string): RouteResult {
    // 1. Check duplicate detection
    if (this.duplicateDetector.isDuplicate(packet.packetId)) {
      return { status: 'DROPPED_DUPLICATE' };
    }

    // 2. If it's a broadcast (null destination)
    if (!packet.destinationId) {
      // It must be delivered locally AND forwarded to other peers
      if (packet.ttl <= 1) {
        return { status: 'DELIVER_LOCAL' }; // Delivered locally, but TTL exhausted for forwarding
      }

      const forwardPacket: Packet = {
        ...packet,
        ttl: packet.ttl - 1,
        routeTrace: [...(packet.routeTrace || []), this.localNodeId],
      };

      return {
        status: 'BROADCAST',
        forwardedPacket: forwardPacket,
      };
    }

    // 3. If destination is this node
    if (packet.destinationId === this.localNodeId) {
      return { status: 'DELIVER_LOCAL' };
    }

    // 4. Packet is destined for another node -> check TTL
    if (packet.ttl <= 1) {
      return { status: 'DROPPED_TTL' };
    }

    // 5. Decrement TTL and append route trace
    const forwardedPacket: Packet = {
      ...packet,
      ttl: packet.ttl - 1,
      routeTrace: [...(packet.routeTrace || []), this.localNodeId],
    };

    // 6. Resolve next hop
    const nextHop = this.routingTable.getNextHop(packet.destinationId);

    // If next hop is known and isn't the one we just received it from
    if (nextHop && nextHop !== incomingFromPeerId) {
      return {
        status: 'FORWARD',
        targetHopId: nextHop,
        forwardedPacket,
      };
    }

    // If next hop is not explicitly known, we can broadcast to all peers (except sender) to find destination
    return {
      status: 'BROADCAST',
      forwardedPacket,
    };
  }

  public learnRoute(sourceId: string, viaPeerId: string, hopsFromSource: number, transport = 'LAN') {
    if (sourceId !== this.localNodeId) {
      this.routingTable.updateRoute(sourceId, viaPeerId, hopsFromSource, transport);
    }
  }
}
