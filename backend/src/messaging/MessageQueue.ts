import { Packet } from '../mesh/Packet.js';

export interface QueuedMessage {
  id: string;
  packet: Packet;
  destinationId: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  backoffMs: number;
  createdAt: number;
}

export class MessageQueue {
  private queue: Map<string, QueuedMessage> = new Map();
  private maxAttempts: number;
  private baseBackoffMs: number;

  constructor(maxAttempts = 5, baseBackoffMs = 1000) {
    this.maxAttempts = maxAttempts;
    this.baseBackoffMs = baseBackoffMs;
  }

  public enqueue(packet: Packet, destinationId: string): QueuedMessage {
    const queued: QueuedMessage = {
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

  public acknowledge(packetId: string): boolean {
    return this.queue.delete(packetId);
  }

  public getPendingForPeer(peerId: string): QueuedMessage[] {
    const now = Date.now();
    const ready: QueuedMessage[] = [];

    for (const msg of this.queue.values()) {
      if (msg.destinationId === peerId && msg.nextRetryAt <= now) {
        ready.push(msg);
      }
    }

    return ready;
  }

  public recordAttempt(packetId: string, success: boolean): boolean {
    const msg = this.queue.get(packetId);
    if (!msg) return false;

    if (success) {
      // Sent over transport, waiting for ACK
      msg.attempts++;
      msg.nextRetryAt = Date.now() + msg.backoffMs;
      msg.backoffMs = Math.min(msg.backoffMs * 2, 60000); // Exponential backoff up to 1 min
      return true;
    } else {
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

  public getQueueLength(): number {
    return this.queue.size;
  }

  public getAllQueued(): QueuedMessage[] {
    return Array.from(this.queue.values());
  }

  public clear(): void {
    this.queue.clear();
  }
}
