"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingTable = void 0;
class RoutingTable {
    // destinationId -> RouteEntry
    routes = new Map();
    routeExpiryMs = 15 * 60 * 1000; // 15 minutes
    updateRoute(destinationId, nextHopId, hopCount, transportType = 'LAN') {
        const existing = this.routes.get(destinationId);
        if (!existing || hopCount < existing.hopCount || (Date.now() - existing.updatedAt > 60000)) {
            this.routes.set(destinationId, {
                destinationId,
                nextHopId,
                hopCount,
                updatedAt: Date.now(),
                transportType,
            });
        }
    }
    getNextHop(destinationId) {
        const route = this.routes.get(destinationId);
        if (!route)
            return null;
        if (Date.now() - route.updatedAt > this.routeExpiryMs) {
            this.routes.delete(destinationId);
            return null;
        }
        return route.nextHopId;
    }
    removeRoute(destinationId) {
        this.routes.delete(destinationId);
    }
    removePeerFromRoutes(peerId) {
        for (const [dest, route] of this.routes.entries()) {
            if (route.nextHopId === peerId || dest === peerId) {
                this.routes.delete(dest);
            }
        }
    }
    getAllRoutes() {
        return Array.from(this.routes.values());
    }
    clear() {
        this.routes.clear();
    }
}
exports.RoutingTable = RoutingTable;
