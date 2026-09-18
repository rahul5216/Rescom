export class SecurityValidator {
  // Session/Peer ID -> Highest received sequence number
  private sequenceTracker: Map<string, number> = new Map();
  // Max time drift allowable in milliseconds (5 minutes)
  private maxClockDriftMs = 5 * 60 * 1000;

  /**
   * Validate sequence number to prevent replay attacks
   * Returns true if sequence number is fresh and valid
   */
  public validateSequence(senderId: string, sequence: number): boolean {
    const lastSeq = this.sequenceTracker.get(senderId);
    if (lastSeq !== undefined && sequence <= lastSeq) {
      // Sequence must be strictly increasing to prevent replay
      return false;
    }
    this.sequenceTracker.set(senderId, sequence);
    return true;
  }

  /**
   * Validate timestamp freshness
   */
  public validateFreshness(timestamp: number): boolean {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    return diff <= this.maxClockDriftMs;
  }

  /**
   * Reset tracking for a peer
   */
  public resetPeer(senderId: string): void {
    this.sequenceTracker.delete(senderId);
  }

  /**
   * Clear all tracked sequences
   */
  public clear(): void {
    this.sequenceTracker.clear();
  }
}
