"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerNode = void 0;
const IdentityManager_js_1 = require("./crypto/IdentityManager.js");
const CryptoService_js_1 = require("./crypto/CryptoService.js");
const SecurityValidator_js_1 = require("./crypto/SecurityValidator.js");
const MeshRouter_js_1 = require("./mesh/MeshRouter.js");
const Packet_js_1 = require("./mesh/Packet.js");
const MessageQueue_js_1 = require("./messaging/MessageQueue.js");
const DeliveryTracker_js_1 = require("./messaging/DeliveryTracker.js");
const FileTransferManager_js_1 = require("./files/FileTransferManager.js");
const FileChunker_js_1 = require("./files/FileChunker.js");
const TransportManager_js_1 = require("./transport/TransportManager.js");
const LanTransport_js_1 = require("./transport/LanTransport.js");
const SimulatedBleTransport_js_1 = require("./transport/SimulatedBleTransport.js");
const Database_js_1 = require("./db/Database.js");
const Repositories_js_1 = require("./db/Repositories.js");
class PeerNode {
    identity;
    securityValidator;
    router;
    queue;
    tracker;
    fileManager;
    lanTransport;
    bleTransport;
    transportManager;
    db;
    repo;
    // Peer ID -> Symmetric shared secret (derived via ECDH)
    sessionSecrets = new Map();
    eventListeners = [];
    constructor(options = {}) {
        this.identity = new IdentityManager_js_1.IdentityManager();
        const id = this.identity.createIdentity(options.displayName || 'Campus Student', options.department || 'Computer Science', options.semester || 'Sem 6');
        this.securityValidator = new SecurityValidator_js_1.SecurityValidator();
        this.router = new MeshRouter_js_1.MeshRouter(id.userId);
        this.queue = new MessageQueue_js_1.MessageQueue(5, 1000);
        this.tracker = new DeliveryTracker_js_1.DeliveryTracker();
        this.fileManager = new FileTransferManager_js_1.FileTransferManager();
        this.db = new Database_js_1.CampusDatabase(options.dbPath);
        this.repo = new Repositories_js_1.Repositories(this.db);
        // Persist local user
        this.repo.saveUser({
            userId: id.userId,
            displayName: id.displayName,
            department: id.department,
            semester: id.semester,
            deviceId: id.deviceId,
            publicKey: id.publicKeyPem,
            createdAt: id.createdAt,
            updatedAt: id.createdAt,
        });
        this.lanTransport = new LanTransport_js_1.LanTransport(id.userId);
        this.bleTransport = new SimulatedBleTransport_js_1.SimulatedBleTransport();
        this.transportManager = new TransportManager_js_1.TransportManager(this.lanTransport, this.bleTransport);
        // Setup incoming packet dispatcher
        this.transportManager.onPacket((pkt, transport, from) => {
            this.handleIncomingPacket(pkt, from, transport);
        });
    }
    getLocalId() {
        return this.identity.getIdentity().userId;
    }
    getPublicProfile() {
        return this.identity.getPublicProfile();
    }
    onEvent(listener) {
        this.eventListeners.push(listener);
    }
    emitEvent(type, data) {
        for (const listener of this.eventListeners) {
            listener({ type, data });
        }
    }
    /**
     * Derive or retrieve shared symmetric secret key for a peer using ECDH
     */
    getOrCreateSharedSecret(peerId, peerPublicKeyPem) {
        let secret = this.sessionSecrets.get(peerId);
        if (!secret) {
            const myPrivKey = this.identity.getIdentity().privateKeyPem;
            secret = CryptoService_js_1.CryptoService.deriveSharedSecret(myPrivKey, peerPublicKeyPem);
            this.sessionSecrets.set(peerId, secret);
        }
        return secret;
    }
    /**
     * Send a private or group chat message
     */
    async sendMessage(receiverId, content, receiverPublicKeyPem, isEncrypted = true) {
        const sender = this.identity.getIdentity();
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const convId = `conv-${[sender.userId, receiverId].sort().join('_')}`;
        // Ensure conversation exists in DB
        this.repo.upsertConversation({
            conversationId: convId,
            type: 'PRIVATE',
            title: `Chat with ${receiverId.substring(0, 8)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        let payloadContent = content;
        let encrypted = 0;
        if (isEncrypted && receiverPublicKeyPem) {
            const sharedSecret = this.getOrCreateSharedSecret(receiverId, receiverPublicKeyPem);
            const encryptedData = CryptoService_js_1.CryptoService.encryptPayload(content, sharedSecret);
            payloadContent = {
                isEncrypted: true,
                encryptedPayload: encryptedData,
            };
            encrypted = 1;
        }
        else {
            payloadContent = {
                isEncrypted: false,
                text: content,
            };
        }
        // Create Packet
        const packet = Packet_js_1.PacketFactory.create(sender.userId, receiverId, Packet_js_1.PacketType.MESSAGE, {
            messageId,
            conversationId: convId,
            ...payloadContent,
        }, 5 // TTL: 5 hops
        );
        // Save message locally in DB
        this.repo.saveMessage({
            messageId,
            conversationId: convId,
            senderId: sender.userId,
            receiverId,
            content,
            messageType: 'TEXT',
            status: 'SENDING',
            createdAt: Date.now(),
            isEncrypted: encrypted,
            relayCount: 0,
        });
        this.tracker.trackMessage(messageId, sender.userId, receiverId);
        // Route packet
        const routeResult = this.router.routePacket(packet);
        if (routeResult.status === 'FORWARD' || routeResult.status === 'BROADCAST') {
            const pktToSend = routeResult.forwardedPacket || packet;
            const success = await this.transportManager.sendPacket(pktToSend, routeResult.targetHopId);
            if (success) {
                this.tracker.markSent(messageId, (pktToSend.routeTrace?.length || 1) - 1);
                this.repo.updateMessageStatus(messageId, 'SENT');
            }
            else {
                // Enqueue in store-and-forward queue
                this.queue.enqueue(packet, receiverId);
                this.repo.updateMessageStatus(messageId, 'QUEUED');
            }
        }
        this.emitEvent('MESSAGE_SENT', { messageId, receiverId, status: 'SENT' });
        return {
            messageId,
            status: 'SENT',
            relayHops: packet.routeTrace?.length || 0,
        };
    }
    /**
     * Broadcast an emergency alert across the entire campus mesh network
     */
    async sendEmergencyBroadcast(content, alertLevel = 'HIGH') {
        const sender = this.identity.getIdentity();
        const signature = CryptoService_js_1.CryptoService.signData(content, sender.privateKeyPem);
        const packet = Packet_js_1.PacketFactory.create(sender.userId, null, // Broadcast to all nodes
        Packet_js_1.PacketType.EMERGENCY_BROADCAST, {
            alertLevel,
            content,
            senderName: sender.displayName,
            senderDept: sender.department,
            senderDeviceId: sender.deviceId,
            publicKeyPem: sender.publicKeyPem,
            timestamp: Date.now(),
        }, 6, // Higher TTL for emergency broadcast
        signature);
        await this.transportManager.sendPacket(packet);
        this.emitEvent('EMERGENCY_BROADCAST', packet);
        return packet;
    }
    /**
     * Send a file to a peer with chunking and SHA-256 verification
     */
    async offerFile(receiverId, filename, buffer, mimeType = 'application/octet-stream') {
        const { metadata, chunks } = FileChunker_js_1.FileChunker.chunkFile(filename, buffer, mimeType);
        const session = this.fileManager.createOutgoingSession(receiverId, metadata);
        // Save transfer in DB
        this.repo.saveFileTransfer({
            transferId: session.transferId,
            filename: metadata.filename,
            mimeType: metadata.mimeType,
            fileSize: metadata.filesize,
            bytesTransferred: 0,
            status: 'IN_PROGRESS',
            createdAt: Date.now(),
        });
        // 1. Send FILE_OFFER packet
        const offerPacket = Packet_js_1.PacketFactory.create(this.getLocalId(), receiverId, Packet_js_1.PacketType.FILE_OFFER, metadata);
        await this.transportManager.sendPacket(offerPacket, receiverId);
        // 2. Send Chunks
        for (const chunk of chunks) {
            const chunkPacket = Packet_js_1.PacketFactory.create(this.getLocalId(), receiverId, Packet_js_1.PacketType.FILE_CHUNK, chunk);
            await this.transportManager.sendPacket(chunkPacket, receiverId);
        }
        this.emitEvent('FILE_TRANSFER_SENT', { transferId: session.transferId, totalChunks: chunks.length });
        return session;
    }
    /**
     * Handle incoming packets from any transport
     */
    async handleIncomingPacket(packet, fromPeerId, transport = 'LAN') {
        // 1. Learn route to source if received via peer
        if (fromPeerId && packet.sourceId !== this.getLocalId()) {
            const hops = (packet.routeTrace?.length || 1);
            this.router.learnRoute(packet.sourceId, fromPeerId, hops, transport);
        }
        // 2. Route evaluation
        const decision = this.router.routePacket(packet, fromPeerId);
        if (decision.status === 'DROPPED_DUPLICATE' || decision.status === 'DROPPED_TTL') {
            return;
        }
        if (decision.status === 'FORWARD' || decision.status === 'BROADCAST') {
            const fwd = decision.forwardedPacket || packet;
            await this.transportManager.sendPacket(fwd, decision.targetHopId);
            // If it's a broadcast, continue to process locally as well!
            if (decision.status !== 'BROADCAST') {
                return;
            }
        }
        // 3. Process local delivery
        await this.processLocalPacket(packet);
    }
    async processLocalPacket(packet) {
        switch (packet.type) {
            case Packet_js_1.PacketType.MESSAGE: {
                const payload = packet.payload;
                let cleartext = '';
                let isEncrypted = 0;
                if (payload.isEncrypted && payload.encryptedPayload) {
                    // Derive shared secret
                    const senderPeer = this.repo.getPeer(packet.sourceId);
                    if (senderPeer && senderPeer.publicKey) {
                        try {
                            const sharedSecret = this.getOrCreateSharedSecret(packet.sourceId, senderPeer.publicKey);
                            cleartext = CryptoService_js_1.CryptoService.decryptPayload(payload.encryptedPayload, sharedSecret);
                            isEncrypted = 1;
                        }
                        catch (err) {
                            cleartext = '[DECRYPTION FAILED: Authenticated Tag Mismatch]';
                        }
                    }
                    else {
                        cleartext = '[Encrypted Message: Missing Peer Public Key]';
                    }
                }
                else {
                    cleartext = payload.text || '';
                }
                const convId = payload.conversationId || `conv-${[this.getLocalId(), packet.sourceId].sort().join('_')}`;
                this.repo.upsertConversation({
                    conversationId: convId,
                    type: 'PRIVATE',
                    title: `Chat with ${packet.sourceId.substring(0, 8)}`,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });
                this.repo.saveMessage({
                    messageId: payload.messageId || packet.packetId,
                    conversationId: convId,
                    senderId: packet.sourceId,
                    receiverId: this.getLocalId(),
                    content: cleartext,
                    messageType: 'TEXT',
                    status: 'DELIVERED',
                    createdAt: packet.timestamp,
                    isEncrypted,
                    relayCount: (packet.routeTrace?.length || 1) - 1,
                });
                // Send MESSAGE_ACK back to sender
                const ackPacket = Packet_js_1.PacketFactory.create(this.getLocalId(), packet.sourceId, Packet_js_1.PacketType.MESSAGE_ACK, {
                    originalMessageId: payload.messageId || packet.packetId,
                    deliveredAt: Date.now(),
                });
                await this.transportManager.sendPacket(ackPacket, packet.sourceId);
                this.emitEvent('MESSAGE_RECEIVED', {
                    messageId: payload.messageId || packet.packetId,
                    senderId: packet.sourceId,
                    content: cleartext,
                    relayCount: (packet.routeTrace?.length || 1) - 1,
                });
                break;
            }
            case Packet_js_1.PacketType.MESSAGE_ACK: {
                const origId = packet.payload.originalMessageId;
                if (origId) {
                    this.tracker.markDelivered(origId);
                    this.queue.acknowledge(origId);
                    this.repo.updateMessageStatus(origId, 'DELIVERED');
                    this.emitEvent('MESSAGE_ACK', { messageId: origId, deliveredAt: packet.payload.deliveredAt });
                }
                break;
            }
            case Packet_js_1.PacketType.EMERGENCY_BROADCAST: {
                const p = packet.payload;
                let verified = false;
                if (packet.signature && p.publicKeyPem) {
                    verified = CryptoService_js_1.CryptoService.verifySignature(p.content, packet.signature, p.publicKeyPem);
                }
                this.emitEvent('EMERGENCY_BROADCAST_RECEIVED', {
                    ...p,
                    signatureVerified: verified,
                    relayHops: (packet.routeTrace?.length || 1) - 1,
                });
                break;
            }
            case Packet_js_1.PacketType.FILE_OFFER: {
                const metadata = packet.payload;
                this.fileManager.createIncomingSession(packet.sourceId, metadata);
                this.emitEvent('FILE_OFFER_RECEIVED', { metadata, senderId: packet.sourceId });
                break;
            }
            case Packet_js_1.PacketType.FILE_CHUNK: {
                try {
                    const chunk = packet.payload;
                    const { session, isComplete } = this.fileManager.receiveChunk(chunk);
                    this.emitEvent('FILE_CHUNK_RECEIVED', {
                        fileId: chunk.fileId,
                        progress: session.progress,
                        isComplete,
                    });
                    if (isComplete) {
                        this.repo.saveFileTransfer({
                            transferId: session.transferId,
                            filename: session.filename,
                            mimeType: session.mimeType,
                            fileSize: session.filesize,
                            bytesTransferred: session.filesize,
                            status: 'COMPLETED',
                            createdAt: session.startedAt,
                            completedAt: Date.now(),
                        });
                        this.emitEvent('FILE_COMPLETED', { session });
                    }
                }
                catch (err) {
                    console.error('[PeerNode] Chunk processing error:', err.message);
                }
                break;
            }
            default:
                break;
        }
    }
    registerPeer(peer) {
        this.repo.upsertPeer({
            peerId: peer.peerId,
            displayName: peer.displayName,
            deviceId: peer.deviceId,
            publicKey: peer.publicKeyPem,
            lastSeen: peer.lastSeen,
            connectionState: peer.connectionState,
            preferredTransport: peer.preferredTransport,
            rssi: peer.rssi,
            hopCount: peer.hopCount,
            relayPeerId: peer.relayPeerId,
        });
        if (peer.publicKeyPem) {
            this.getOrCreateSharedSecret(peer.peerId, peer.publicKeyPem);
        }
    }
}
exports.PeerNode = PeerNode;
