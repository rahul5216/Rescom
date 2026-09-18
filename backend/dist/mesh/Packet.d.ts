export declare enum PacketType {
    HELLO = "HELLO",
    IDENTITY = "IDENTITY",
    SESSION_INIT = "SESSION_INIT",
    SESSION_ACK = "SESSION_ACK",
    MESSAGE = "MESSAGE",
    MESSAGE_ACK = "MESSAGE_ACK",
    FILE_OFFER = "FILE_OFFER",
    FILE_CHUNK = "FILE_CHUNK",
    FILE_ACK = "FILE_ACK",
    ROUTE_DISCOVERY = "ROUTE_DISCOVERY",
    ROUTE_UPDATE = "ROUTE_UPDATE",
    ERROR = "ERROR",
    EMERGENCY_BROADCAST = "EMERGENCY_BROADCAST"
}
export interface Packet<T = any> {
    packetId: string;
    sourceId: string;
    destinationId: string | null;
    type: PacketType;
    ttl: number;
    sequence: number;
    timestamp: number;
    payload: T;
    signature?: string;
    routeTrace?: string[];
}
export declare class PacketFactory {
    private static sequenceCounter;
    static create<T>(sourceId: string, destinationId: string | null, type: PacketType, payload: T, ttl?: number, signature?: string): Packet<T>;
}
