"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueue = void 0;
class MessageQueue {
    queue = new Map();
    maxAttempts;
    baseBackoffMs;
    constructor(maxAttempts = 5, baseBackoffMs = 1000) {
        this.maxAttempts = maxAttempts;
        this.baseBackoffMs = baseBackoffMs;
    }
    enqueue(packet, destinationId) {
        const queued = {
            id: packet.packetId,
            packet,
            destinationId,
            attempts: 0,
            maxAttempts: this.maxAttempts,
            nextRetryAt: Date.now(),
            backoffMs: this.baseBackoffMs,
            createdAt: Date.now(),
        };
        this.queue.set(packet.packetId, queued);
        return queued;
    }
    acknowledge(packetId) {
        return this.queue.delete(packetId);
    }
    getPendingForPeer(peerId) {
        const now = Date.now();
        const ready = [];
        for (const msg of this.queue.values()) {
            if (msg.destinationId === peerId && msg.nextRetryAt <= now) {
                ready.push(msg);
            }
        }
        return ready;
    }
    recordAttempt(packetId, success) {
        const msg = this.queue.get(packetId);
        if (!msg)
            return false;
        if (success) {
            // Sent over transport, waiting for ACK
            msg.attempts++;
            msg.nextRetryAt = Date.now() + msg.backoffMs;
            msg.backoffMs = Math.min(msg.backoffMs * 2, 60000); // Exponential backoff up to 1 min
            return true;
        }
        else {
            msg.attempts++;
            if (msg.attempts >= msg.maxAttempts) {
                this.queue.delete(packetId);
                return false; // Dropped after exceeding retries
            }
            msg.nextRetryAt = Date.now() + msg.backoffMs;
            msg.backoffMs = Math.min(msg.backoffMs * 2, 60000);
            return true;
        }
    }
    getQueueLength() {
        return this.queue.size;
    }
    getAllQueued() {
        return Array.from(this.queue.values());
    }
    clear() {
        this.queue.clear();
    }
}
exports.MessageQueue = MessageQueue;
