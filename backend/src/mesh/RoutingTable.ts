export interface RouteEntry {
  destinationId: string;
  nextHopId: string;
  hopCount: number;
  updatedAt: number;
  transportType: string;
}

export class RoutingTable {
  // destinationId -> RouteEntry
  private routes: Map<string, RouteEntry> = new Map();
  private routeExpiryMs = 15 * 60 * 1000; // 15 minutes

  public updateRoute(destinationId: string, nextHopId: string, hopCount: number, transportType = 'LAN'): void {
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

  public getNextHop(destinationId: string): string | null {
    const route = this.routes.get(destinationId);
    if (!route) return null;

    if (Date.now() - route.updatedAt > this.routeExpiryMs) {
      this.routes.delete(destinationId);
      return null;
    }

    return route.nextHopId;
  }

  public removeRoute(destinationId: string): void {
    this.routes.delete(destinationId);
  }

  public removePeerFromRoutes(peerId: string): void {
    for (const [dest, route] of this.routes.entries()) {
      if (route.nextHopId === peerId || dest === peerId) {
        this.routes.delete(dest);
      }
    }
  }

  public getAllRoutes(): RouteEntry[] {
    return Array.from(this.routes.values());
  }

  public clear(): void {
    this.routes.clear();
  }
}
