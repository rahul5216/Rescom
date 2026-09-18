"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFactory = exports.PacketType = void 0;
var PacketType;
(function (PacketType) {
    PacketType["HELLO"] = "HELLO";
    PacketType["IDENTITY"] = "IDENTITY";
    PacketType["SESSION_INIT"] = "SESSION_INIT";
    PacketType["SESSION_ACK"] = "SESSION_ACK";
    PacketType["MESSAGE"] = "MESSAGE";
    PacketType["MESSAGE_ACK"] = "MESSAGE_ACK";
    PacketType["FILE_OFFER"] = "FILE_OFFER";
    PacketType["FILE_CHUNK"] = "FILE_CHUNK";
    PacketType["FILE_ACK"] = "FILE_ACK";
    PacketType["ROUTE_DISCOVERY"] = "ROUTE_DISCOVERY";
    PacketType["ROUTE_UPDATE"] = "ROUTE_UPDATE";
    PacketType["ERROR"] = "ERROR";
    PacketType["EMERGENCY_BROADCAST"] = "EMERGENCY_BROADCAST";
})(PacketType || (exports.PacketType = PacketType = {}));
class PacketFactory {
    static sequenceCounter = 0;
    static create(sourceId, destinationId, type, payload, ttl = 5, signature) {
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
exports.PacketFactory = PacketFactory;
