"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshRouter = void 0;
const DuplicateDetector_js_1 = require("./DuplicateDetector.js");
const RoutingTable_js_1 = require("./RoutingTable.js");
class MeshRouter {
    localNodeId;
    duplicateDetector;
    routingTable;
    constructor(localNodeId, duplicateDetector, routingTable) {
        this.localNodeId = localNodeId;
        this.duplicateDetector = duplicateDetector || new DuplicateDetector_js_1.DuplicateDetector();
        this.routingTable = routingTable || new RoutingTable_js_1.RoutingTable();
    }
    getRoutingTable() {
        return this.routingTable;
    }
    getDuplicateDetector() {
        return this.duplicateDetector;
    }
    /**
     * Process an incoming packet and determine forwarding or local delivery
     */
    routePacket(packet, incomingFromPeerId) {
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
            const forwardPacket = {
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
        const forwardedPacket = {
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
    learnRoute(sourceId, viaPeerId, hopsFromSource, transport = 'LAN') {
        if (sourceId !== this.localNodeId) {
            this.routingTable.updateRoute(sourceId, viaPeerId, hopsFromSource, transport);
        }
    }
}
exports.MeshRouter = MeshRouter;
