export class DuplicateDetector {
  private seenPackets: Map<string, number> = new Map();
  private maxCapacity: number;
  private ttlMs: number;

  constructor(maxCapacity = 10000, ttlMs = 10 * 60 * 1000) {
    this.maxCapacity = maxCapacity;
    this.ttlMs = ttlMs;
  }

  /**
   * Check if packetId has already been seen.
   * If seen, returns true.
   * If fresh, records it and returns false.
   */
  public isDuplicate(packetId: string): boolean {
    const now = Date.now();
    this.cleanupExpired(now);

    if (this.seenPackets.has(packetId)) {
      return true;
    }

    if (this.seenPackets.size >= this.maxCapacity) {
      // Remove oldest entry
      const oldestKey = this.seenPackets.keys().next().value;
      if (oldestKey) {
        this.seenPackets.delete(oldestKey);
      }
    }

    this.seenPackets.set(packetId, now);
    return false;
  }

  private cleanupExpired(now: number): void {
    // Only cleanup periodically if size grows
    if (this.seenPackets.size > 100) {
      for (const [key, timestamp] of this.seenPackets.entries()) {
        if (now - timestamp > this.ttlMs) {
          this.seenPackets.delete(key);
        } else {
          // Since Map iterates in insertion order, we can break early if entries are chronological
          break;
        }
      }
    }
  }

  public clear(): void {
    this.seenPackets.clear();
  }
}
