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
export declare class MessageQueue {
    private queue;
    private maxAttempts;
    private baseBackoffMs;
    constructor(maxAttempts?: number, baseBackoffMs?: number);
    enqueue(packet: Packet, destinationId: string): QueuedMessage;
    acknowledge(packetId: string): boolean;
    getPendingForPeer(peerId: string): QueuedMessage[];
    recordAttempt(packetId: string, success: boolean): boolean;
    getQueueLength(): number;
    getAllQueued(): QueuedMessage[];
    clear(): void;
}
