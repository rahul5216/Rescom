"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryTracker = void 0;
class DeliveryTracker {
    records = new Map();
    trackMessage(messageId, senderId, receiverId) {
        const record = {
            messageId,
            senderId,
            receiverId,
            status: 'SENDING',
            sentAt: Date.now(),
            relayCount: 0,
        };
        this.records.set(messageId, record);
        return record;
    }
    markSent(messageId, relayCount = 0) {
        const record = this.records.get(messageId);
        if (record) {
            record.status = 'SENT';
            record.relayCount = relayCount;
        }
    }
    markDelivered(messageId) {
        const record = this.records.get(messageId);
        if (record) {
            record.status = 'DELIVERED';
            record.deliveredAt = Date.now();
        }
    }
    markFailed(messageId) {
        const record = this.records.get(messageId);
        if (record) {
            record.status = 'FAILED';
        }
    }
    getStatus(messageId) {
        return this.records.get(messageId);
    }
    getAll() {
        return Array.from(this.records.values());
    }
}
exports.DeliveryTracker = DeliveryTracker;
