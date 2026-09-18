export interface RouteEntry {
    destinationId: string;
    nextHopId: string;
    hopCount: number;
    updatedAt: number;
    transportType: string;
}
export declare class RoutingTable {
    private routes;
    private routeExpiryMs;
    updateRoute(destinationId: string, nextHopId: string, hopCount: number, transportType?: string): void;
    getNextHop(destinationId: string): string | null;
    removeRoute(destinationId: string): void;
    removePeerFromRoutes(peerId: string): void;
    getAllRoutes(): RouteEntry[];
    clear(): void;
}
