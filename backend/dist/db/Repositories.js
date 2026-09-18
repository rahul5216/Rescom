"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repositories = void 0;
class Repositories {
    db;
    constructor(db) {
        this.db = db;
    }
    // --- USER REPOSITORY ---
    saveUser(user) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`
      INSERT INTO users (userId, displayName, department, semester, deviceId, publicKey, profileImageUri, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        displayName = excluded.displayName,
        department = excluded.department,
        semester = excluded.semester,
        updatedAt = excluded.updatedAt;
    `);
        stmt.run(user.userId, user.displayName, user.department, user.semester, user.deviceId, user.publicKey, user.profileImageUri || '', user.createdAt, user.updatedAt);
    }
    getUser(userId) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`SELECT * FROM users WHERE userId = ?`);
        const row = stmt.get(userId);
        return row || null;
    }
    // --- PEER REPOSITORY ---
    upsertPeer(peer) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`
      INSERT INTO peers (peerId, displayName, deviceId, publicKey, lastSeen, connectionState, preferredTransport, rssi, hopCount, relayPeerId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(peerId) DO UPDATE SET
        displayName = excluded.displayName,
        lastSeen = excluded.lastSeen,
        connectionState = excluded.connectionState,
        preferredTransport = excluded.preferredTransport,
        rssi = excluded.rssi,
        hopCount = excluded.hopCount,
        relayPeerId = excluded.relayPeerId;
    `);
        stmt.run(peer.peerId, peer.displayName, peer.deviceId, peer.publicKey || '', peer.lastSeen, peer.connectionState, peer.preferredTransport, peer.rssi || -60, peer.hopCount || 1, peer.relayPeerId || '');
    }
    getAllPeers() {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`SELECT * FROM peers ORDER BY lastSeen DESC`);
        return stmt.all() || [];
    }
    getPeer(peerId) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`SELECT * FROM peers WHERE peerId = ?`);
        const row = stmt.get(peerId);
        return row || null;
    }
    // --- CONVERSATION REPOSITORY ---
    upsertConversation(conv) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`
      INSERT INTO conversations (conversationId, type, title, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(conversationId) DO UPDATE SET
        title = excluded.title,
        updatedAt = excluded.updatedAt;
    `);
        stmt.run(conv.conversationId, conv.type, conv.title, conv.createdAt, conv.updatedAt);
    }
    getAllConversations() {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`SELECT * FROM conversations ORDER BY updatedAt DESC`);
        return stmt.all() || [];
    }
    // --- MESSAGE REPOSITORY ---
    saveMessage(msg) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`
      INSERT INTO messages (messageId, conversationId, senderId, receiverId, content, messageType, status, createdAt, expiresAt, isEncrypted, relayCount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(messageId) DO UPDATE SET
        status = excluded.status,
        relayCount = excluded.relayCount;
    `);
        stmt.run(msg.messageId, msg.conversationId, msg.senderId, msg.receiverId || '', msg.content, msg.messageType, msg.status, msg.createdAt, msg.expiresAt || 0, msg.isEncrypted, msg.relayCount);
    }
    getMessagesForConversation(convId) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC`);
        return stmt.all(convId) || [];
    }
    updateMessageStatus(messageId, status) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`UPDATE messages SET status = ? WHERE messageId = ?`);
        stmt.run(status, messageId);
    }
    // --- FILE TRANSFER REPOSITORY ---
    saveFileTransfer(tx) {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`
      INSERT INTO file_transfers (transferId, messageId, filename, mimeType, fileSize, localUri, bytesTransferred, status, createdAt, completedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(transferId) DO UPDATE SET
        bytesTransferred = excluded.bytesTransferred,
        status = excluded.status,
        completedAt = excluded.completedAt;
    `);
        stmt.run(tx.transferId, tx.messageId || '', tx.filename, tx.mimeType, tx.fileSize, tx.localUri || '', tx.bytesTransferred, tx.status, tx.createdAt, tx.completedAt || 0);
    }
    getAllFileTransfers() {
        const raw = this.db.getRawDb();
        const stmt = raw.prepare(`SELECT * FROM file_transfers ORDER BY createdAt DESC`);
        return stmt.all() || [];
    }
}
exports.Repositories = Repositories;
