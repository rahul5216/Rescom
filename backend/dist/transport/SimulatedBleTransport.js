"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatedBleTransport = void 0;
class SimulatedBleTransport {
    transportType = 'BLE';
    packetHandlers = [];
    peerDiscoveredHandlers = [];
    simulatedNearbyPeers = new Map();
    scanInterval = null;
    constructor() {
        this.seedDefaultSimulatedPeers();
    }
    seedDefaultSimulatedPeers() {
        const campusPeers = [
            {
                peerId: 'peer-rahul-01',
                displayName: 'Rahul Sharma (CS Lab)',
                deviceId: 'cg-node-a1b2c3d4e5f60001',
                publicKeyPem: '',
                connectionState: 'CONNECTED',
                preferredTransport: 'BLE',
                lastSeen: Date.now(),
                rssi: -58,
                hopCount: 1,
            },
            {
                peerId: 'peer-aman-02',
                displayName: 'Aman Verma (Library 2F)',
                deviceId: 'cg-node-b2c3d4e5f6a10002',
                publicKeyPem: '',
                connectionState: 'CONNECTED',
                preferredTransport: 'WIFI_DIRECT',
                lastSeen: Date.now() - 15000,
                rssi: -72,
                hopCount: 1,
            },
            {
                peerId: 'peer-priya-03',
                displayName: 'Priya Nair (Auditorium)',
                deviceId: 'cg-node-c3d4e5f6a1b20003',
                publicKeyPem: '',
                connectionState: 'CONNECTING',
                preferredTransport: 'BLE',
                lastSeen: Date.now() - 32000,
                rssi: -85,
                hopCount: 2,
                relayPeerId: 'peer-aman-02',
            },
            {
                peerId: 'peer-campus-admin-04',
                displayName: 'Rescom Relay Node #4',
                deviceId: 'cg-node-d4e5f6a1b2c30004',
                publicKeyPem: '',
                connectionState: 'CONNECTED',
                preferredTransport: 'LAN',
                lastSeen: Date.now(),
                rssi: -42,
                hopCount: 1,
            },
        ];
        for (const p of campusPeers) {
            this.simulatedNearbyPeers.set(p.peerId, p);
        }
    }
    async discover() {
        // Return list with simulated fluctuating RSSI
        return Array.from(this.simulatedNearbyPeers.values()).map(p => ({
            ...p,
            rssi: (p.rssi || -60) + Math.floor(Math.random() * 5 - 2),
            lastSeen: Date.now(),
        }));
    }
    addPeer(peer) {
        this.simulatedNearbyPeers.set(peer.peerId, peer);
        for (const h of this.peerDiscoveredHandlers) {
            h(peer);
        }
    }
    async connect(peer) {
        const existing = this.simulatedNearbyPeers.get(peer.peerId);
        if (existing) {
            existing.connectionState = 'CONNECTED';
            return true;
        }
        peer.connectionState = 'CONNECTED';
        this.simulatedNearbyPeers.set(peer.peerId, peer);
        return true;
    }
    async send(packet, targetAddress) {
        // BLE is best-effort simulation
        return true;
    }
    async disconnect(peerId) {
        if (peerId) {
            const p = this.simulatedNearbyPeers.get(peerId);
            if (p)
                p.connectionState = 'DISCONNECTED';
        }
    }
    onPacket(handler) {
        this.packetHandlers.push(handler);
    }
    onPeerDiscovered(handler) {
        this.peerDiscoveredHandlers.push(handler);
    }
    triggerIncomingPacket(packet, fromPeerId) {
        for (const h of this.packetHandlers) {
            h(packet, fromPeerId);
        }
    }
}
exports.SimulatedBleTransport = SimulatedBleTransport;
