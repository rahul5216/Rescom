export declare class SecurityValidator {
    private sequenceTracker;
    private maxClockDriftMs;
    /**
     * Validate sequence number to prevent replay attacks
     * Returns true if sequence number is fresh and valid
     */
    validateSequence(senderId: string, sequence: number): boolean;
    /**
     * Validate timestamp freshness
     */
    validateFreshness(timestamp: number): boolean;
    /**
     * Reset tracking for a peer
     */
    resetPeer(senderId: string): void;
    /**
     * Clear all tracked sequences
     */
    clear(): void;
}
