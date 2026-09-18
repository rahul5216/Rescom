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

export class DeliveryTracker {
  private records: Map<string, DeliveryRecord> = new Map();

  public trackMessage(messageId: string, senderId: string, receiverId: string): DeliveryRecord {
    const record: DeliveryRecord = {
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

  public markSent(messageId: string, relayCount = 0): void {
    const record = this.records.get(messageId);
    if (record) {
      record.status = 'SENT';
      record.relayCount = relayCount;
    }
  }

  public markDelivered(messageId: string): void {
    const record = this.records.get(messageId);
    if (record) {
      record.status = 'DELIVERED';
      record.deliveredAt = Date.now();
    }
  }

  public markFailed(messageId: string): void {
    const record = this.records.get(messageId);
    if (record) {
      record.status = 'FAILED';
    }
  }

  public getStatus(messageId: string): DeliveryRecord | undefined {
    return this.records.get(messageId);
  }

  public getAll(): DeliveryRecord[] {
    return Array.from(this.records.values());
  }
}
