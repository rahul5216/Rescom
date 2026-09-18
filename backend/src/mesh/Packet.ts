export enum PacketType {
  HELLO = 'HELLO',
  IDENTITY = 'IDENTITY',
  SESSION_INIT = 'SESSION_INIT',
  SESSION_ACK = 'SESSION_ACK',
  MESSAGE = 'MESSAGE',
  MESSAGE_ACK = 'MESSAGE_ACK',
  FILE_OFFER = 'FILE_OFFER',
  FILE_CHUNK = 'FILE_CHUNK',
  FILE_ACK = 'FILE_ACK',
  ROUTE_DISCOVERY = 'ROUTE_DISCOVERY',
  ROUTE_UPDATE = 'ROUTE_UPDATE',
  ERROR = 'ERROR',
  EMERGENCY_BROADCAST = 'EMERGENCY_BROADCAST',
}

export interface Packet<T = any> {
  packetId: string;
  sourceId: string;
  destinationId: string | null; // null for broadcast
  type: PacketType;
  ttl: number;                  // Time to live (e.g. 5 hops max)
  sequence: number;             // Monotonically increasing sequence number
  timestamp: number;
  payload: T;
  signature?: string;           // Optional cryptographic signature
  routeTrace?: string[];        // Relay nodes this packet traversed
}

export class PacketFactory {
  private static sequenceCounter = 0;

  public static create<T>(
    sourceId: string,
    destinationId: string | null,
    type: PacketType,
    payload: T,
    ttl = 5,
    signature?: string
  ): Packet<T> {
    this.sequenceCounter++;
    return {
      packetId: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sourceId,
      destinationId,
      type,
      ttl,
      sequence: this.sequenceCounter,
      timestamp: Date.now(),
      payload,
      signature,
      routeTrace: [sourceId],
    };
  }
}
