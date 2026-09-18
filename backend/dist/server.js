"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = __importDefault(require("node:http"));
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("ws");
const peerNode_js_1 = require("./peerNode.js");
const CryptoService_js_1 = require("./crypto/CryptoService.js");
const Packet_js_1 = require("./mesh/Packet.js");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
// Check if frontend build exists in either ../frontend/dist or ./frontend/dist
const possibleDistPaths = [
    node_path_1.default.resolve(process.cwd(), '../frontend/dist'),
    node_path_1.default.resolve(process.cwd(), 'frontend/dist'),
    node_path_1.default.resolve(process.cwd(), './dist/frontend'),
];
const frontendDist = possibleDistPaths.find(p => node_fs_1.default.existsSync(p)) || possibleDistPaths[0];
if (node_fs_1.default.existsSync(frontendDist)) {
    app.use(express_1.default.static(frontendDist));
}
const server = node_http_1.default.createServer(app);
// Primary Rescom node for this machine
const localNode = new peerNode_js_1.PeerNode({
    displayName: 'Rahul (Local Device)',
    department: 'Computer Science & Eng',
    semester: 'Sem 6',
    dbPath: './campus_grid.db',
});
// Attach LanTransport WebSocket server to the HTTP server on /mesh-lan
localNode.lanTransport.attachServer(server);
// WebSocket Server for Frontend UI updates
const uiWss = new ws_1.WebSocketServer({ server, path: '/ws' });
const uiClients = new Set();
uiWss.on('connection', (ws) => {
    uiClients.add(ws);
    // Send initial state
    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        profile: localNode.getPublicProfile(),
        peers: localNode.repo.getAllPeers(),
        conversations: localNode.repo.getAllConversations(),
    }));
    ws.on('close', () => {
        uiClients.delete(ws);
    });
});
function broadcastToUI(event, data) {
    const msg = JSON.stringify({ type: event, data });
    for (const client of uiClients) {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(msg);
        }
    }
}
// Forward all PeerNode domain events to UI clients
localNode.onEvent((evt) => {
    broadcastToUI(evt.type, evt.data);
});
// Seed simulated campus peers with their real cryptographic public keys
const peerKeysAman = CryptoService_js_1.CryptoService.generateKeyPair();
const peerKeysPriya = CryptoService_js_1.CryptoService.generateKeyPair();
const peerKeysAdmin = CryptoService_js_1.CryptoService.generateKeyPair();
localNode.registerPeer({
    peerId: 'peer-aman-02',
    displayName: 'Aman Verma',
    deviceId: CryptoService_js_1.CryptoService.computeDeviceId(peerKeysAman.publicKeyPem),
    publicKeyPem: peerKeysAman.publicKeyPem,
    connectionState: 'CONNECTED',
    preferredTransport: 'WIFI_DIRECT',
    lastSeen: Date.now(),
    rssi: -52,
    hopCount: 1,
});
localNode.registerPeer({
    peerId: 'peer-priya-03',
    displayName: 'Priya Nair',
    deviceId: CryptoService_js_1.CryptoService.computeDeviceId(peerKeysPriya.publicKeyPem),
    publicKeyPem: peerKeysPriya.publicKeyPem,
    connectionState: 'CONNECTED',
    preferredTransport: 'BLE',
    lastSeen: Date.now() - 10000,
    rssi: -78,
    hopCount: 2,
    relayPeerId: 'peer-aman-02',
});
localNode.registerPeer({
    peerId: 'peer-admin-01',
    displayName: 'Rescom Gateway #1',
    deviceId: CryptoService_js_1.CryptoService.computeDeviceId(peerKeysAdmin.publicKeyPem),
    publicKeyPem: peerKeysAdmin.publicKeyPem,
    connectionState: 'CONNECTED',
    preferredTransport: 'LAN',
    lastSeen: Date.now(),
    rssi: -40,
    hopCount: 1,
});
// Setup simulated multi-hop routes in routing table
localNode.router.learnRoute('peer-aman-02', 'peer-aman-02', 1, 'WIFI_DIRECT');
localNode.router.learnRoute('peer-priya-03', 'peer-aman-02', 2, 'BLE'); // Priya reachable via Aman!
localNode.router.learnRoute('peer-admin-01', 'peer-admin-01', 1, 'LAN');
// Seed an initial conversation
const sampleConvId = `conv-${[localNode.getLocalId(), 'peer-aman-02'].sort().join('_')}`;
localNode.repo.upsertConversation({
    conversationId: sampleConvId,
    type: 'PRIVATE',
    title: 'Aman Verma',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
});
localNode.repo.saveMessage({
    messageId: 'msg-init-1',
    conversationId: sampleConvId,
    senderId: 'peer-aman-02',
    receiverId: localNode.getLocalId(),
    content: 'Hey Rahul! Campus Wi-Fi is completely down in Block B. Are you receiving this over mesh?',
    messageType: 'TEXT',
    status: 'DELIVERED',
    createdAt: Date.now() - 1800000,
    isEncrypted: 1,
    relayCount: 0,
});
// ---------------- REST API ROUTES ----------------
// GET /api/health — Docker healthcheck + uptime monitoring
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '2.0.0',
        nodeId: localNode.getLocalId(),
        uptime: process.uptime(),
        timestamp: Date.now(),
    });
});
// GET /api/profile
app.get('/api/profile', (req, res) => {
    res.json({
        success: true,
        profile: localNode.getPublicProfile(),
    });
});
// POST /api/profile
app.post('/api/profile', (req, res) => {
    const { displayName, department, semester } = req.body;
    const updated = localNode.identity.updateProfile(displayName, department, semester);
    localNode.repo.saveUser({
        userId: updated.userId,
        displayName: updated.displayName,
        department: updated.department,
        semester: updated.semester,
        deviceId: updated.deviceId,
        publicKey: updated.publicKeyPem,
        createdAt: updated.createdAt,
        updatedAt: Date.now(),
    });
    broadcastToUI('PROFILE_UPDATED', localNode.getPublicProfile());
    res.json({ success: true, profile: localNode.getPublicProfile() });
});
// GET /api/peers
app.get('/api/peers', async (req, res) => {
    const peers = await localNode.transportManager.discoverAllPeers();
    const dbPeers = localNode.repo.getAllPeers();
    res.json({ success: true, peers: dbPeers.length > 0 ? dbPeers : peers });
});
// POST /api/peers/connect
app.post('/api/peers/connect', async (req, res) => {
    const { peerId } = req.body;
    const peer = localNode.repo.getPeer(peerId);
    if (!peer) {
        return res.status(404).json({ success: false, error: 'Peer not found' });
    }
    peer.connectionState = 'CONNECTED';
    localNode.repo.upsertPeer(peer);
    broadcastToUI('PEER_CONNECTED', peer);
    res.json({ success: true, peer });
});
// GET /api/conversations
app.get('/api/conversations', (req, res) => {
    const convs = localNode.repo.getAllConversations();
    res.json({ success: true, conversations: convs });
});
// GET /api/conversations/:id/messages
app.get('/api/conversations/:id/messages', (req, res) => {
    const messages = localNode.repo.getMessagesForConversation(req.params.id);
    res.json({ success: true, messages });
});
// POST /api/messages
app.post('/api/messages', async (req, res) => {
    try {
        const { receiverId, content, isEncrypted } = req.body;
        const peer = localNode.repo.getPeer(receiverId);
        const result = await localNode.sendMessage(receiverId, content, peer?.publicKey, isEncrypted !== false);
        res.json({ success: true, result });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// POST /api/emergency
app.post('/api/emergency', async (req, res) => {
    try {
        const { content, alertLevel } = req.body;
        const packet = await localNode.sendEmergencyBroadcast(content, alertLevel || 'CRITICAL');
        res.json({ success: true, packetId: packet.packetId });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/files
app.get('/api/files', (req, res) => {
    const transfers = localNode.repo.getAllFileTransfers();
    res.json({ success: true, transfers });
});
// POST /api/files/send
app.post('/api/files/send', async (req, res) => {
    try {
        const { receiverId, filename, dataBase64, mimeType } = req.body;
        const buf = Buffer.from(dataBase64, 'base64');
        const session = await localNode.offerFile(receiverId, filename, buf, mimeType || 'application/octet-stream');
        res.json({ success: true, transfer: session });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/topology
app.get('/api/topology', (req, res) => {
    const localId = localNode.getLocalId();
    const peers = localNode.repo.getAllPeers();
    const routes = localNode.router.getRoutingTable().getAllRoutes();
    const nodes = [
        {
            id: localId,
            label: localNode.identity.getIdentity().displayName + ' (You)',
            isLocal: true,
            status: 'CONNECTED',
        },
        ...peers.map((p) => ({
            id: p.peerId,
            label: p.displayName,
            isLocal: false,
            status: p.connectionState,
            hopCount: p.hopCount || 1,
            transport: p.preferredTransport,
        })),
    ];
    const links = [];
    for (const p of peers) {
        if (p.hopCount === 1 || !p.relayPeerId) {
            links.push({
                source: localId,
                target: p.peerId,
                type: p.preferredTransport,
                direct: true,
            });
        }
        else if (p.relayPeerId) {
            links.push({
                source: p.relayPeerId,
                target: p.peerId,
                type: p.preferredTransport,
                direct: false,
            });
        }
    }
    res.json({ success: true, nodes, links, routes });
});
// POST /api/loadtest - Live Heavy Server Stress Test
app.post('/api/loadtest', async (req, res) => {
    const { totalRequests = 500, concurrency = 50 } = req.body;
    const startTime = Date.now();
    let completed = 0;
    let errors = 0;
    const latencies = [];
    // Generate simulated peer key for encryption benchmarking
    const testKey = CryptoService_js_1.CryptoService.generateKeyPair();
    const sharedKey = localNode.getOrCreateSharedSecret('test-peer-load', testKey.publicKeyPem);
    // Batch runner for concurrency
    const runBatch = async () => {
        while (completed + errors < totalRequests) {
            const idx = completed + errors;
            if (idx >= totalRequests)
                break;
            const reqStart = performance.now();
            try {
                // High load workload:
                // 1. Packet creation
                // 2. AES-256-GCM authenticated payload encryption
                // 3. Security validation
                // 4. Duplicate detection check
                // 5. Mesh route evaluation
                // 6. DB write & read transaction
                const payloadText = `Stress Test Packet #${idx} - Concurrency Load Validation`;
                const encrypted = CryptoService_js_1.CryptoService.encryptPayload(payloadText, sharedKey);
                const decrypted = CryptoService_js_1.CryptoService.decryptPayload(encrypted, sharedKey);
                const pkt = Packet_js_1.PacketFactory.create('test-peer-load', localNode.getLocalId(), Packet_js_1.PacketType.MESSAGE, { isEncrypted: true, encryptedPayload: encrypted, text: decrypted }, 5);
                localNode.securityValidator.validateSequence('test-peer-load', idx + 1);
                localNode.router.routePacket(pkt);
                const reqEnd = performance.now();
                latencies.push(reqEnd - reqStart);
                completed++;
            }
            catch {
                errors++;
            }
        }
    };
    const workers = Array.from({ length: Math.min(concurrency, 100) }, () => runBatch());
    await Promise.all(workers);
    const totalDurationMs = Date.now() - startTime;
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
    const rps = Math.round((completed / (totalDurationMs / 1000)));
    const report = {
        totalRequests,
        completed,
        errors,
        totalDurationMs,
        requestsPerSecond: rps,
        latency: {
            avgMs: parseFloat(avg.toFixed(2)),
            p50Ms: parseFloat(p50.toFixed(2)),
            p95Ms: parseFloat(p95.toFixed(2)),
            p99Ms: parseFloat(p99.toFixed(2)),
            minMs: parseFloat((latencies[0] || 0).toFixed(2)),
            maxMs: parseFloat((latencies[latencies.length - 1] || 0).toFixed(2)),
        },
        system: {
            memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            uptimeSeconds: Math.round(process.uptime()),
        },
    };
    broadcastToUI('LOAD_TEST_COMPLETED', report);
    res.json({ success: true, report });
});
if (node_fs_1.default.existsSync(frontendDist)) {
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/mesh-lan')) {
            return next();
        }
        res.sendFile(node_path_1.default.join(frontendDist, 'index.html'));
    });
}
server.listen(port, () => {
    console.log(`[Rescom] Server running on http://localhost:${port}`);
    console.log(`[Rescom] Mesh LAN WebSocket at ws://localhost:${port}/mesh-lan`);
    console.log(`[Rescom] Client UI WebSocket at ws://localhost:${port}/ws`);
});
