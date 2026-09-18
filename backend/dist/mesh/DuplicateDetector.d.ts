export declare class DuplicateDetector {
    private seenPackets;
    private maxCapacity;
    private ttlMs;
    constructor(maxCapacity?: number, ttlMs?: number);
    /**
     * Check if packetId has already been seen.
     * If seen, returns true.
     * If fresh, records it and returns false.
     */
    isDuplicate(packetId: string): boolean;
    private cleanupExpired;
    clear(): void;
}
