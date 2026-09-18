"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileTransferManager = void 0;
const FileChunker_js_1 = require("./FileChunker.js");
class FileTransferManager {
    sessions = new Map();
    createOutgoingSession(peerId, metadata) {
        const session = {
            transferId: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            fileId: metadata.fileId,
            filename: metadata.filename,
            filesize: metadata.filesize,
            mimeType: metadata.mimeType,
            totalChunks: metadata.totalChunks,
            peerId,
            direction: 'OUTGOING',
            status: 'IN_PROGRESS',
            receivedChunks: new Map(),
            progress: 0,
            expectedHash: metadata.fileHash,
            startedAt: Date.now(),
        };
        this.sessions.set(session.transferId, session);
        return session;
    }
    createIncomingSession(peerId, metadata) {
        const session = {
            transferId: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            fileId: metadata.fileId,
            filename: metadata.filename,
            filesize: metadata.filesize,
            mimeType: metadata.mimeType,
            totalChunks: metadata.totalChunks,
            peerId,
            direction: 'INCOMING',
            status: 'IN_PROGRESS',
            receivedChunks: new Map(),
            progress: 0,
            expectedHash: metadata.fileHash,
            startedAt: Date.now(),
        };
        this.sessions.set(session.fileId, session);
        this.sessions.set(session.transferId, session);
        return session;
    }
    receiveChunk(chunk) {
        const session = this.sessions.get(chunk.fileId);
        if (!session) {
            throw new Error(`No transfer session found for fileId: ${chunk.fileId}`);
        }
        session.receivedChunks.set(chunk.chunkIndex, chunk);
        session.progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);
        if (session.receivedChunks.size === session.totalChunks) {
            const chunksList = Array.from(session.receivedChunks.values());
            const { buffer, valid } = FileChunker_js_1.FileChunker.reassembleFile(chunksList, session.expectedHash);
            if (valid) {
                session.status = 'COMPLETED';
                session.completedAt = Date.now();
                session.assembledBuffer = buffer;
                return { session, isComplete: true };
            }
            else {
                session.status = 'FAILED';
                throw new Error('Hash verification failed after reassembly');
            }
        }
        return { session, isComplete: false };
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    getAllSessions() {
        // Deduplicate by transferId
        const unique = new Map();
        for (const session of this.sessions.values()) {
            unique.set(session.transferId, session);
        }
        return Array.from(unique.values());
    }
}
exports.FileTransferManager = FileTransferManager;
