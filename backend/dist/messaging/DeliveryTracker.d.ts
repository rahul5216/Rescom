export type MessageDeliveryStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
export interface DeliveryRecord {
    messageId: string;
    senderId: string;
    receiverId: string;
    status: MessageDeliveryStatus;
    sentAt: number;
    deliveredAt?: number;
    relayCount: number;
}
export declare class DeliveryTracker {
    private records;
    trackMessage(messageId: string, senderId: string, receiverId: string): DeliveryRecord;
    markSent(messageId: string, relayCount?: number): void;
    markDelivered(messageId: string): void;
    markFailed(messageId: string): void;
    getStatus(messageId: string): DeliveryRecord | undefined;
    getAll(): DeliveryRecord[];
}
