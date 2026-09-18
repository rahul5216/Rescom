"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportManager = void 0;
const Packet_js_1 = require("../mesh/Packet.js");
class TransportManager {
    lanTransport;
    bleTransport;
    packetHandlers = [];
    constructor(lanTransport, bleTransport) {
        this.lanTransport = lanTransport;
        this.bleTransport = bleTransport;
        this.lanTransport.onPacket((pkt, from) => this.dispatchPacket(pkt, 'LAN', from));
        this.bleTransport.onPacket((pkt, from) => this.dispatchPacket(pkt, 'BLE', from));
    }
    getLanTransport() {
        return this.lanTransport;
    }
    getBleTransport() {
        return this.bleTransport;
    }
    async discoverAllPeers() {
        const [lanPeers, blePeers] = await Promise.all([
            this.lanTransport.discover(),
            this.bleTransport.discover(),
        ]);
        const peerMap = new Map();
        for (const p of blePeers) {
            peerMap.set(p.peerId, p);
        }
        // LAN peers override BLE with better throughput
        for (const p of lanPeers) {
            peerMap.set(p.peerId, p);
        }
        return Array.from(peerMap.values());
    }
    /**
     * Route packet to appropriate transport based on size and type
     */
    async sendPacket(packet, targetPeerId) {
        const isControl = [
            Packet_js_1.PacketType.HELLO,
            Packet_js_1.PacketType.IDENTITY,
            Packet_js_1.PacketType.ROUTE_DISCOVERY,
            Packet_js_1.PacketType.ROUTE_UPDATE,
        ].includes(packet.type);
        if (isControl) {
            // Control messages can go over BLE or LAN
            await this.bleTransport.send(packet, targetPeerId);
        }
        // High throughput, data messages, and files use LAN
        return this.lanTransport.send(packet, targetPeerId);
    }
    onPacket(handler) {
        this.packetHandlers.push(handler);
    }
    dispatchPacket(packet, transportType, fromPeerId) {
        for (const handler of this.packetHandlers) {
            handler(packet, transportType, fromPeerId);
        }
    }
}
exports.TransportManager = TransportManager;
